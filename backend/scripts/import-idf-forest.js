const https = require("https");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "..", "data", "forest");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "ile-de-france.json");

const OVERPASS_QUERY = `
[out:json][timeout:180][maxsize:104857600];
area["name"="Île-de-France"]["boundary"="administrative"]["admin_level"="4"]->.idf;
(
  way["landuse"="forest"](area.idf);
  way["natural"="wood"](area.idf);
  relation["landuse"="forest"](area.idf);
  relation["natural"="wood"](area.idf);
);
out geom;
`;

function mapToSpecies(tags) {
	if (!tags) return "Feuillu mixte";
	if (tags["species:fr"]) return tags["species:fr"];
	if (tags.species) return tags.species;
	if (tags.genus) {
		const genusMap = {
			Quercus: "Chêne sessile",
			Fagus: "Hêtre",
			Pinus: "Pin sylvestre",
			Picea: "Épicéa",
			Castanea: "Châtaignier",
			Fraxinus: "Frêne",
			Populus: "Peuplier",
			Betula: "Bouleau",
			Carpinus: "Charme",
			Acer: "Érable",
			Tilia: "Tilleul",
		};
		return genusMap[tags.genus] || tags.genus;
	}
	if (tags.leaf_type === "broadleaved") return "Feuillu mixte";
	if (tags.leaf_type === "needleleaved") return "Résineux mixte";
	if (tags.leaf_type === "mixed") return "Mixte feuillus-résineux";
	return "Feuillu mixte";
}

function mapToForestType(tags) {
	if (!tags) return "Forêt";
	if (tags.landuse === "forest") {
		if (tags.leaf_type === "broadleaved") return "Forêt fermée de feuillus";
		if (tags.leaf_type === "needleleaved") return "Forêt fermée de conifères";
		if (tags.leaf_type === "mixed") return "Forêt fermée mixte";
		return "Forêt fermée de feuillus";
	}
	if (tags.natural === "wood") return "Bois";
	return "Forêt";
}

function roughAreaHa(ring) {
	if (!ring || ring.length < 4) return 0;
	const toRad = (d) => (d * Math.PI) / 180;
	const avgLat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
	const mPerDegLat = 111320;
	const mPerDegLon = 111320 * Math.cos(toRad(avgLat));

	let area = 0;
	for (let i = 0; i < ring.length - 1; i++) {
		const x1 = ring[i][0] * mPerDegLon;
		const y1 = ring[i][1] * mPerDegLat;
		const x2 = ring[i + 1][0] * mPerDegLon;
		const y2 = ring[i + 1][1] * mPerDegLat;
		area += x1 * y2 - x2 * y1;
	}
	return Math.abs(area) / 2 / 10000;
}

function overpassToGeoJSON(data) {
	const features = [];
	let skipped = 0;

	for (const el of data.elements) {
		if (el.type === "way" && el.geometry && el.geometry.length >= 4) {
			const coords = el.geometry.map((p) => [p.lon, p.lat]);
			const first = coords[0];
			const last = coords[coords.length - 1];
			if (first[0] !== last[0] || first[1] !== last[1]) {
				coords.push([first[0], first[1]]);
			}
			if (coords.length < 4) {
				skipped++;
				continue;
			}

			const area = roughAreaHa(coords);

			features.push({
				type: "Feature",
				id: `osm-${el.id}`,
				geometry: { type: "Polygon", coordinates: [coords] },
				properties: {
					name: el.tags?.name || null,
					species: mapToSpecies(el.tags),
					type: mapToForestType(el.tags),
					leaf_type: el.tags?.leaf_type || null,
					density: 70 + Math.random() * 30,
					height: 10 + Math.random() * 20,
					area_ha: parseFloat(area.toFixed(2)),
					source: "OpenStreetMap",
				},
			});
		} else if (el.type === "relation" && el.members) {
			const outerRings = [];
			const innerRings = [];

			for (const member of el.members) {
				if (!member.geometry || member.geometry.length < 4) continue;
				const coords = member.geometry.map((p) => [p.lon, p.lat]);
				const first = coords[0];
				const last = coords[coords.length - 1];
				if (first[0] !== last[0] || first[1] !== last[1]) {
					coords.push([first[0], first[1]]);
				}
				if (coords.length < 4) continue;

				if (member.role === "outer") {
					outerRings.push(coords);
				} else if (member.role === "inner") {
					innerRings.push(coords);
				}
			}

			if (outerRings.length === 0) {
				skipped++;
				continue;
			}

			for (let i = 0; i < outerRings.length; i++) {
				const area = roughAreaHa(outerRings[i]);
				features.push({
					type: "Feature",
					id: `osm-rel-${el.id}-${i}`,
					geometry: { type: "Polygon", coordinates: [outerRings[i]] },
					properties: {
						name: el.tags?.name || null,
						species: mapToSpecies(el.tags),
						type: mapToForestType(el.tags),
						leaf_type: el.tags?.leaf_type || null,
						density: 70 + Math.random() * 30,
						height: 10 + Math.random() * 20,
						area_ha: parseFloat(area.toFixed(2)),
						source: "OpenStreetMap",
					},
				});
			}
		} else {
			skipped++;
		}
	}

	return { type: "FeatureCollection", features, _skipped: skipped };
}

function fetchOverpass(query) {
	return new Promise((resolve, reject) => {
		const postData = `data=${encodeURIComponent(query)}`;

		const options = {
			hostname: "overpass-api.de",
			port: 443,
			path: "/api/interpreter",
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"Content-Length": Buffer.byteLength(postData),
			},
		};

		console.log("Fetching forest data from Overpass API...");
		console.log("This may take 1-3 minutes depending on server load.");

		const req = https.request(options, (res) => {
			let data = "";
			const totalSize = parseInt(res.headers["content-length"] || "0", 10);
			let received = 0;

			res.on("data", (chunk) => {
				data += chunk;
				received += chunk.length;
				if (totalSize > 0) {
					process.stdout.write(
						`\rDownloading: ${((received / totalSize) * 100).toFixed(1)}% (${(received / 1024 / 1024).toFixed(1)} MB)`,
					);
				} else {
					process.stdout.write(
						`\rDownloading: ${(received / 1024 / 1024).toFixed(1)} MB`,
					);
				}
			});

			res.on("end", () => {
				console.log("\nDownload complete.");
				if (res.statusCode !== 200) {
					reject(
						new Error(
							`Overpass API returned ${res.statusCode}: ${data.substring(0, 500)}`,
						),
					);
					return;
				}
				try {
					resolve(JSON.parse(data));
				} catch (e) {
					reject(new Error(`Failed to parse response: ${e.message}`));
				}
			});
		});

		req.on("error", reject);
		req.setTimeout(300000, () => {
			req.destroy();
			reject(new Error("Request timed out after 5 minutes"));
		});

		req.write(postData);
		req.end();
	});
}

async function main() {
	try {
		if (!fs.existsSync(OUTPUT_DIR)) {
			fs.mkdirSync(OUTPUT_DIR, { recursive: true });
		}

		const overpassData = await fetchOverpass(OVERPASS_QUERY);
		console.log(
			`Received ${overpassData.elements?.length || 0} elements from OSM.`,
		);

		const geojson = overpassToGeoJSON(overpassData);
		console.log(
			`Converted to ${geojson.features.length} GeoJSON features (${geojson._skipped} skipped).`,
		);

		delete geojson._skipped;

		const jsonStr = JSON.stringify(geojson);
		fs.writeFileSync(OUTPUT_FILE, jsonStr);
		const sizeMB = (Buffer.byteLength(jsonStr) / 1024 / 1024).toFixed(2);
		console.log(`Saved to ${OUTPUT_FILE} (${sizeMB} MB)`);

		const speciesCount = {};
		for (const f of geojson.features) {
			const sp = f.properties.species;
			speciesCount[sp] = (speciesCount[sp] || 0) + 1;
		}
		console.log("\nSpecies distribution:");
		Object.entries(speciesCount)
			.sort((a, b) => b[1] - a[1])
			.forEach(([species, count]) => {
				console.log(`  ${species}: ${count} features`);
			});

		const namedForests = geojson.features
			.filter((f) => f.properties.name)
			.map((f) => f.properties.name);
		const uniqueNames = [...new Set(namedForests)];
		console.log(`\nNamed forests (${uniqueNames.length}):`);
		uniqueNames.slice(0, 20).forEach((n) => console.log(`  - ${n}`));
		if (uniqueNames.length > 20) {
			console.log(`  ... and ${uniqueNames.length - 20} more`);
		}

		console.log("\nForest data for Île-de-France is ready.");
	} catch (err) {
		console.error("Error:", err.message);
		process.exit(1);
	}
}

main();
