const fs = require("fs");
const path = require("path");

const INPUT = path.join(
	__dirname,
	"..",
	"data",
	"forest",
	"ile-de-france.json",
);
const OUTPUT = path.join(
	__dirname,
	"..",
	"data",
	"forest",
	"ile-de-france.json",
);

const MIN_AREA_HA = 2;
const PRECISION = 4;

function roundCoord(coord) {
	return [
		parseFloat(coord[0].toFixed(PRECISION)),
		parseFloat(coord[1].toFixed(PRECISION)),
	];
}

function simplifyRing(ring) {
	if (ring.length <= 5) return ring.map(roundCoord);

	const simplified = [roundCoord(ring[0])];
	const minDist = 0.00005;

	for (let i = 1; i < ring.length - 1; i++) {
		const prev = simplified[simplified.length - 1];
		const curr = ring[i];
		const dx = curr[0] - prev[0];
		const dy = curr[1] - prev[1];
		if (Math.sqrt(dx * dx + dy * dy) > minDist) {
			simplified.push(roundCoord(curr));
		}
	}

	simplified.push(simplified[0]);
	return simplified;
}

function main() {
	console.log("Reading forest data...");
	const data = JSON.parse(fs.readFileSync(INPUT, "utf-8"));
	console.log(`Input: ${data.features.length} features`);

	const filtered = [];
	let tooSmall = 0;
	let tooFewPoints = 0;

	for (const feature of data.features) {
		if (feature.properties.area_ha < MIN_AREA_HA) {
			tooSmall++;
			continue;
		}

		const coords = feature.geometry.coordinates.map((ring) => {
			const simplified = simplifyRing(ring);
			return simplified;
		});

		if (coords[0].length < 4) {
			tooFewPoints++;
			continue;
		}

		filtered.push({
			type: "Feature",
			id: feature.id,
			geometry: { type: "Polygon", coordinates: coords },
			properties: {
				name: feature.properties.name || null,
				species: feature.properties.species,
				type: feature.properties.type,
				density: parseFloat((feature.properties.density || 75).toFixed(0)),
				height: parseFloat((feature.properties.height || 15).toFixed(0)),
				area_ha: feature.properties.area_ha,
			},
		});
	}

	console.log(`Filtered out ${tooSmall} features < ${MIN_AREA_HA} ha`);
	console.log(`Filtered out ${tooFewPoints} features with too few points`);
	console.log(`Output: ${filtered.length} features`);

	const geojson = { type: "FeatureCollection", features: filtered };
	const jsonStr = JSON.stringify(geojson);
	fs.writeFileSync(OUTPUT, jsonStr);
	const sizeMB = (Buffer.byteLength(jsonStr) / 1024 / 1024).toFixed(2);
	console.log(`Saved to ${OUTPUT} (${sizeMB} MB)`);
}

main();
