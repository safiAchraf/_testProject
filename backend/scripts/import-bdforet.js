const { Client } = require("pg");
const shapefile = require("shapefile");
const proj4 = require("proj4");
const path = require("path");
const fs = require("fs");

proj4.defs(
	"EPSG:2154",
	"+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs",
);

const lambert93ToWgs84 = proj4("EPSG:2154", "EPSG:4326");

const DATA_DIR = path.join(__dirname, "..", "data", "bdforet");

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

function reprojectCoords(coords) {
	if (typeof coords[0] === "number") {
		return lambert93ToWgs84.forward(coords);
	}
	return coords.map(reprojectCoords);
}

function extractSpecies(properties) {
	if (properties.ESSENCE) return properties.ESSENCE;
	const tfv = properties.TFV || "";
	if (tfv.includes("Chêne")) return "Chêne";
	if (tfv.includes("Hêtre")) return "Hêtre";
	if (tfv.includes("Pin")) return "Pin";
	if (tfv.includes("Sapin")) return "Sapin";
	if (tfv.includes("Épicéa")) return "Épicéa";
	if (tfv.includes("Châtaignier")) return "Châtaignier";
	if (tfv.includes("feuillus")) return "Feuillu mixte";
	if (tfv.includes("conifères")) return "Résineux mixte";
	if (tfv.includes("mixte")) return "Mixte";
	return "Indéterminé";
}

function extractForestType(properties) {
	return properties.TFV || properties.TFV_G11 || "Forêt";
}

function computeAreaHa(geometry) {
	if (!geometry || !geometry.coordinates) return 0;
	const ring =
		geometry.type === "MultiPolygon"
			? geometry.coordinates[0][0]
			: geometry.coordinates[0];
	if (!ring || ring.length < 4) return 0;

	const toRad = (d) => (d * Math.PI) / 180;
	const R = 6378137;
	let area = 0;
	for (let i = 0; i < ring.length - 1; i++) {
		const [lon1, lat1] = ring[i];
		const [lon2, lat2] = ring[i + 1];
		area +=
			toRad(lon2 - lon1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
	}
	area = (Math.abs(area) * R * R) / 2;
	return area / 10000;
}

async function readShapefile(shpPath) {
	const features = [];
	const source = await shapefile.open(shpPath);

	while (true) {
		const result = await source.read();
		if (result.done) break;

		const feature = result.value;
		if (!feature.geometry) continue;

		feature.geometry.coordinates = reprojectCoords(
			feature.geometry.coordinates,
		);
		features.push(feature);
	}

	return features;
}

function findShapefiles(dir) {
	const shpFiles = [];
	if (!fs.existsSync(dir)) return shpFiles;

	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			shpFiles.push(...findShapefiles(fullPath));
		} else if (entry.name.endsWith(".shp")) {
			shpFiles.push(fullPath);
		}
	}
	return shpFiles;
}

async function main() {
	const shpFiles = findShapefiles(DATA_DIR);

	if (shpFiles.length === 0) {
		console.error(`No .shp files found in ${DATA_DIR}`);
		console.error(
			"Download BD Forêt V2 Shapefiles from https://geoservices.ign.fr/bdforet#telechargementv2",
		);
		console.error(`Extract them into ${DATA_DIR}`);
		process.exit(1);
	}

	console.log(`Found ${shpFiles.length} shapefile(s):`);
	shpFiles.forEach((f) => console.log(`  ${path.basename(f)}`));

	const client = new Client(DB_CONFIG);
	await client.connect();
	console.log("Connected to database.");

	try {
		await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");

		await client.query(`
			CREATE TABLE IF NOT EXISTS forest_zones (
				id SERIAL PRIMARY KEY,
				"codeTfv" VARCHAR,
				name VARCHAR,
				species VARCHAR DEFAULT 'Indéterminé',
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

		let totalImported = 0;
		let totalSkipped = 0;

		for (const shpPath of shpFiles) {
			console.log(`\nProcessing ${path.basename(shpPath)}...`);
			const features = await readShapefile(shpPath);
			console.log(`  Read ${features.length} features`);

			let imported = 0;
			let skipped = 0;

			for (let i = 0; i < features.length; i += BATCH_SIZE) {
				const batch = features.slice(i, i + BATCH_SIZE);
				const values = [];
				const params = [];
				let paramIdx = 1;

				for (const feature of batch) {
					const props = feature.properties || {};
					const geometry = feature.geometry;

					if (
						!geometry ||
						!geometry.coordinates ||
						geometry.coordinates.length === 0
					) {
						skipped++;
						continue;
					}

					const species = extractSpecies(props);
					const forestType = extractForestType(props);
					const areaHa = computeAreaHa(geometry);
					const geomJson = JSON.stringify(geometry);

					values.push(
						`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, ST_SetSRID(ST_GeomFromGeoJSON($${paramIdx + 5}), 4326))`,
					);
					params.push(
						props.CODE_TFV || null,
						species,
						forestType,
						areaHa,
						props.NOM || null,
						geomJson,
					);
					paramIdx += 6;
				}

				if (values.length > 0) {
					await client.query(
						`INSERT INTO forest_zones ("codeTfv", species, "forestType", "areaHa", name, geom)
						 VALUES ${values.join(", ")}`,
						params,
					);
					imported += values.length;
				}

				process.stdout.write(`\r  Imported: ${imported}/${features.length}`);
			}

			console.log(`\n  Done: ${imported} imported, ${skipped} skipped`);
			totalImported += imported;
			totalSkipped += skipped;
		}

		console.log(
			`\nTotal: ${totalImported} features imported, ${totalSkipped} skipped`,
		);

		const finalCount = await client.query("SELECT COUNT(*) FROM forest_zones");
		console.log(`Rows in forest_zones: ${finalCount.rows[0].count}`);

		await client.query("ANALYZE forest_zones;");
		console.log("Table statistics updated.");
	} finally {
		await client.end();
	}
}

main().catch((err) => {
	console.error("Error:", err);
	process.exit(1);
});
