const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(
	__dirname,
	"..",
	"data",
	"forest",
	"ile-de-france.json",
);

const DB_CONFIG = {
	host: process.env.DATABASE_HOST || "localhost",
	port: parseInt(process.env.DATABASE_PORT || "5432"),
	user: process.env.DATABASE_USER || "postgres",
	password: process.env.DATABASE_PASSWORD || "postgres",
	database: process.env.DATABASE_NAME || "forest_db",
	ssl:
		process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
};

const BATCH_SIZE = 500;

async function main() {
	console.log("Reading GeoJSON data...");
	if (!fs.existsSync(DATA_FILE)) {
		console.error(`Data file not found: ${DATA_FILE}`);
		console.error(
			"Run 'npm run import:idf-forest' first to download the data.",
		);
		process.exit(1);
	}

	const geojson = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
	console.log(`Found ${geojson.features.length} features to import.`);

	const client = new Client(DB_CONFIG);
	await client.connect();
	console.log("Connected to database.");

	try {
		await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");

		await client.query(`
      CREATE TABLE IF NOT EXISTS forest_zones (
        id SERIAL PRIMARY KEY,
        "osmId" VARCHAR,
        name VARCHAR,
        species VARCHAR DEFAULT 'Feuillu mixte',
        "forestType" VARCHAR DEFAULT 'Forêt',
        density FLOAT,
        height FLOAT,
        "areaHa" FLOAT DEFAULT 0,
        geom geometry(Geometry, 4326),
        "createdAt" TIMESTAMP DEFAULT NOW()
      );
    `);

		await client.query(`
      CREATE INDEX IF NOT EXISTS idx_forest_zones_geom
      ON forest_zones USING GIST (geom);
    `);

		const countResult = await client.query("SELECT COUNT(*) FROM forest_zones");
		const existingCount = parseInt(countResult.rows[0].count);

		if (existingCount > 0) {
			console.log(
				`Table already has ${existingCount} rows. Clearing before import...`,
			);
			await client.query("TRUNCATE forest_zones RESTART IDENTITY");
		}

		let imported = 0;
		let skipped = 0;

		for (let i = 0; i < geojson.features.length; i += BATCH_SIZE) {
			const batch = geojson.features.slice(i, i + BATCH_SIZE);

			const values = [];
			const params = [];
			let paramIdx = 1;

			for (const feature of batch) {
				const props = feature.properties || {};
				const geomJson = JSON.stringify(feature.geometry);

				if (
					!feature.geometry ||
					!feature.geometry.coordinates ||
					feature.geometry.coordinates.length === 0
				) {
					skipped++;
					continue;
				}

				values.push(
					`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6}, ST_SetSRID(ST_GeomFromGeoJSON($${paramIdx + 7}), 4326))`,
				);
				params.push(
					feature.id || null,
					props.name || null,
					props.species || "Feuillu mixte",
					props.type || "Forêt",
					props.density || null,
					props.height || null,
					props.area_ha || 0,
					geomJson,
				);
				paramIdx += 8;
			}

			if (values.length > 0) {
				const query = `
          INSERT INTO forest_zones ("osmId", name, species, "forestType", density, height, "areaHa", geom)
          VALUES ${values.join(", ")}
        `;

				await client.query(query, params);
				imported += values.length;
			}

			process.stdout.write(
				`\rImported: ${imported}/${geojson.features.length} (${((imported / geojson.features.length) * 100).toFixed(1)}%)`,
			);
		}

		console.log(
			`\nImport complete: ${imported} features imported, ${skipped} skipped.`,
		);

		const finalCount = await client.query("SELECT COUNT(*) FROM forest_zones");
		console.log(`Total rows in forest_zones: ${finalCount.rows[0].count}`);

		const sampleQuery = await client.query(`
      SELECT COUNT(*) as cnt
      FROM forest_zones
      WHERE ST_Intersects(
        geom,
        ST_MakeEnvelope(2.2, 48.8, 2.5, 48.95, 4326)
      )
    `);
		console.log(
			`Sample spatial query (Paris area): ${sampleQuery.rows[0].cnt} features found.`,
		);

		await client.query("ANALYZE forest_zones;");
		console.log("Table statistics updated.");
	} finally {
		await client.end();
	}

	console.log("\nImport finished.");
}

main().catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
