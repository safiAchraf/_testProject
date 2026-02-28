import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { polygon as turfPolygon, featureCollection } from "@turf/helpers";
import turfArea from "@turf/area";
import turfBbox from "@turf/bbox";
import turfIntersect from "@turf/intersect";
import turfCentroid from "@turf/centroid";
import turfBooleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { AnalyzePolygonDto } from "./dto/analyze-polygon.dto";
import { ForestZone } from "./entities/forest-zone.entity";

@Injectable()
export class GeoService {
	private readonly logger = new Logger(GeoService.name);

	constructor(
		@InjectRepository(ForestZone)
		private readonly forestRepo: Repository<ForestZone>,
	) {}

	async getRegions() {
		return [
			{
				id: "11",
				name: "Île-de-France",
				code: "IDF",
				center: { lng: 2.3522, lat: 48.8566 },
				bbox: [1.4461, 48.1203, 3.5586, 49.2415],
			},
			{
				id: "24",
				name: "Centre-Val de Loire",
				code: "CVL",
				center: { lng: 1.4334, lat: 47.7516 },
				bbox: [0.0658, 46.3514, 3.1329, 48.6066],
			},
			{
				id: "27",
				name: "Bourgogne-Franche-Comté",
				code: "BFC",
				center: { lng: 4.8357, lat: 47.2805 },
				bbox: [2.837, 46.1586, 7.1662, 48.4066],
			},
			{
				id: "28",
				name: "Normandie",
				code: "NOR",
				center: { lng: 0.3658, lat: 49.1829 },
				bbox: [-1.9931, 48.1825, 1.7969, 50.0795],
			},
			{
				id: "32",
				name: "Hauts-de-France",
				code: "HDF",
				center: { lng: 2.9358, lat: 50.4801 },
				bbox: [1.3733, 48.8385, 4.2677, 51.089],
			},
			{
				id: "44",
				name: "Grand Est",
				code: "GES",
				center: { lng: 5.9342, lat: 48.6999 },
				bbox: [3.3906, 47.4193, 8.233, 50.1283],
			},
			{
				id: "52",
				name: "Pays de la Loire",
				code: "PDL",
				center: { lng: -0.5792, lat: 47.7633 },
				bbox: [-2.5575, 46.2701, 0.9211, 48.5749],
			},
			{
				id: "53",
				name: "Bretagne",
				code: "BRE",
				center: { lng: -2.7574, lat: 48.202 },
				bbox: [-5.1403, 47.279, -0.9686, 48.891],
			},
			{
				id: "75",
				name: "Nouvelle-Aquitaine",
				code: "NAQ",
				center: { lng: 0.0, lat: 45.0 },
				bbox: [-2.2275, 42.7769, 2.5974, 47.0911],
			},
			{
				id: "76",
				name: "Occitanie",
				code: "OCC",
				center: { lng: 1.4442, lat: 43.8927 },
				bbox: [-0.3275, 42.3332, 4.8412, 45.0463],
			},
			{
				id: "84",
				name: "Auvergne-Rhône-Alpes",
				code: "ARA",
				center: { lng: 4.8357, lat: 45.4472 },
				bbox: [2.0419, 44.1183, 7.178, 46.8088],
			},
			{
				id: "93",
				name: "Provence-Alpes-Côte d'Azur",
				code: "PAC",
				center: { lng: 6.0679, lat: 43.9352 },
				bbox: [4.2277, 42.9826, 7.7199, 45.1329],
			},
			{
				id: "94",
				name: "Corse",
				code: "COR",
				center: { lng: 9.0, lat: 42.0 },
				bbox: [8.5375, 41.3336, 9.5602, 43.0279],
			},
		];
	}

	async getDepartmentsByRegion(regionId: string) {
		const departments = {
			"11": [
				{ id: "75", name: "Paris", center: { lng: 2.3522, lat: 48.8566 } },
				{
					id: "77",
					name: "Seine-et-Marne",
					center: { lng: 2.9658, lat: 48.6167 },
				},
				{ id: "78", name: "Yvelines", center: { lng: 1.8833, lat: 48.8 } },
				{ id: "91", name: "Essonne", center: { lng: 2.2167, lat: 48.5333 } },
				{ id: "92", name: "Hauts-de-Seine", center: { lng: 2.22, lat: 48.85 } },
				{
					id: "93",
					name: "Seine-Saint-Denis",
					center: { lng: 2.4419, lat: 48.9097 },
				},
				{
					id: "94",
					name: "Val-de-Marne",
					center: { lng: 2.4653, lat: 48.7764 },
				},
				{ id: "95", name: "Val-d'Oise", center: { lng: 2.22, lat: 49.05 } },
			],
			"75": [
				{ id: "16", name: "Charente", center: { lng: 0.1503, lat: 45.6497 } },
				{
					id: "17",
					name: "Charente-Maritime",
					center: { lng: -0.9667, lat: 45.75 },
				},
				{ id: "19", name: "Corrèze", center: { lng: 1.7667, lat: 45.2667 } },
				{ id: "23", name: "Creuse", center: { lng: 1.8833, lat: 46.1667 } },
				{ id: "24", name: "Dordogne", center: { lng: 0.7167, lat: 45.15 } },
				{ id: "33", name: "Gironde", center: { lng: -0.5792, lat: 44.8378 } },
				{ id: "40", name: "Landes", center: { lng: -0.5, lat: 43.8833 } },
				{
					id: "47",
					name: "Lot-et-Garonne",
					center: { lng: 0.6333, lat: 44.35 },
				},
				{
					id: "64",
					name: "Pyrénées-Atlantiques",
					center: { lng: -0.8833, lat: 43.3 },
				},
				{
					id: "79",
					name: "Deux-Sèvres",
					center: { lng: -0.4833, lat: 46.3231 },
				},
				{ id: "86", name: "Vienne", center: { lng: 0.3333, lat: 46.58 } },
				{
					id: "87",
					name: "Haute-Vienne",
					center: { lng: 1.2578, lat: 45.8314 },
				},
			],
		};

		return departments[regionId] || [];
	}

	async getCommunesByDepartment(departmentId: string) {
		return [
			{
				id: `${departmentId}-001`,
				name: `Commune 1 - Dept ${departmentId}`,
				center: { lng: 2.3522, lat: 48.8566 },
			},
			{
				id: `${departmentId}-002`,
				name: `Commune 2 - Dept ${departmentId}`,
				center: { lng: 2.3622, lat: 48.8666 },
			},
			{
				id: `${departmentId}-003`,
				name: `Commune 3 - Dept ${departmentId}`,
				center: { lng: 2.3422, lat: 48.8466 },
			},
		];
	}

	async getForestDataByZone(zoneId: string, zoneType: string) {
		let bbox: number[] | null = null;

		if (zoneType === "region") {
			const regions = await this.getRegions();
			const region = regions.find((r) => r.id === zoneId);
			if (region) bbox = region.bbox;
		} else if (zoneType === "department") {
			const deptBboxes: Record<string, number[]> = {
				"75": [2.22, 48.815, 2.47, 48.905],
				"77": [2.39, 48.12, 3.56, 49.12],
				"78": [1.44, 48.43, 2.23, 49.09],
				"91": [2.04, 48.28, 2.59, 48.62],
				"92": [2.14, 48.72, 2.34, 48.95],
				"93": [2.34, 48.84, 2.6, 49.01],
				"94": [2.33, 48.68, 2.62, 48.86],
				"95": [1.6, 48.9, 2.6, 49.24],
			};
			bbox = deptBboxes[zoneId] || null;
		}

		if (bbox) {
			return this.getForestByBbox(bbox, 5000);
		}

		return { type: "FeatureCollection", features: [] };
	}

	async getCadastreByBounds(bounds: number[]) {
		const features = [];

		const [minLng, minLat, maxLng, maxLat] = bounds;
		const area = (maxLng - minLng) * (maxLat - minLat);

		if (area < 0.01) {
			for (let i = 0; i < 10; i++) {
				const lng = minLng + Math.random() * (maxLng - minLng);
				const lat = minLat + Math.random() * (maxLat - minLat);

				features.push({
					type: "Feature",
					id: `parcel-${i}`,
					geometry: {
						type: "Polygon",
						coordinates: [
							[
								[lng, lat],
								[lng + 0.001, lat],
								[lng + 0.001, lat + 0.001],
								[lng, lat + 0.001],
								[lng, lat],
							],
						],
					},
					properties: {
						parcelId: `000-AB-${i.toString().padStart(4, "0")}`,
						section: "AB",
						number: i,
						surface: Math.random() * 5000,
					},
				});
			}
		}

		return {
			type: "FeatureCollection",
			features,
		};
	}

	async getForestByBbox(bounds: number[], limit = 2000, zoom = 10) {
		const [minLng, minLat, maxLng, maxLat] = bounds;

		let tolerance = 0;
		if (zoom < 10) tolerance = 0.005;
		else if (zoom < 12) tolerance = 0.002;
		else if (zoom < 14) tolerance = 0.0005;

		const geomExpr =
			tolerance > 0
				? `ST_AsGeoJSON(ST_Simplify(geom, ${tolerance}))`
				: `ST_AsGeoJSON(geom)`;

		const rows: any[] = await this.forestRepo.query(
			`SELECT id, "osmId", name, species, "forestType", density, height, "areaHa",
			        ${geomExpr} AS geojson
			 FROM forest_zones
			 WHERE ST_Intersects(geom, ST_MakeEnvelope($1, $2, $3, $4, 4326))
			 LIMIT $5`,
			[minLng, minLat, maxLng, maxLat, limit],
		);

		const features = rows
			.map((r) => {
				const geometry = JSON.parse(r.geojson);
				if (
					!geometry ||
					!geometry.coordinates ||
					geometry.coordinates.length === 0
				)
					return null;
				return {
					type: "Feature",
					id: `forest-${r.id}`,
					geometry,
					properties: {
						species: r.species,
						type: r.forestType,
						density: r.density,
						height: r.height,
						area_ha: r.areaHa,
					},
				};
			})
			.filter(Boolean);

		this.logger.log(
			`PostGIS: ${features.length} forest features for bbox [${bounds.join(", ")}] zoom=${zoom}`,
		);
		return { type: "FeatureCollection", features };
	}

	private async getForestFeaturesInPolygon(
		polygonGeoJSON: any,
	): Promise<any[]> {
		const rows: any[] = await this.forestRepo.query(
			`SELECT id, "osmId", name, species, "forestType", density, height, "areaHa",
			        ST_AsGeoJSON(geom) AS geojson
			 FROM forest_zones
			 WHERE ST_Intersects(geom, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))`,
			[JSON.stringify(polygonGeoJSON)],
		);

		return rows.map((r) => ({
			type: "Feature",
			id: `forest-${r.id}`,
			geometry: JSON.parse(r.geojson),
			properties: {
				species: r.species,
				type: r.forestType,
				density: r.density,
				height: r.height,
				area_ha: r.areaHa,
			},
		}));
	}

	async analyzePolygon(analyzePolygonDto: AnalyzePolygonDto) {
		const { geometry } = analyzePolygonDto;

		const polygon = turfPolygon(geometry.coordinates);
		const areaSquareMeters = turfArea(polygon);
		const areaHectares = areaSquareMeters / 10000;

		const bbox = turfBbox(polygon);

		const forestFeatures = await this.getForestFeaturesInPolygon(geometry);
		this.logger.log(
			`Analyzing polygon: ${areaHectares.toFixed(2)} ha, ${forestFeatures.length} candidate forest features`,
		);

		const cadastreData = await this.getCadastreByBounds(bbox);

		const speciesDistribution: Record<string, number> = {};
		let totalForestArea = 0;

		for (const feature of forestFeatures) {
			try {
				const featurePolygon = turfPolygon(feature.geometry.coordinates);
				const intersection = turfIntersect(
					featureCollection([polygon, featurePolygon]),
				);

				if (intersection) {
					const intersectionArea = turfArea(intersection) / 10000;
					const species = feature.properties?.species || "Unknown";

					speciesDistribution[species] =
						(speciesDistribution[species] || 0) + intersectionArea;
					totalForestArea += intersectionArea;
				}
			} catch (e) {}
		}

		const parcelsInPolygon: string[] = [];
		cadastreData.features.forEach((feature) => {
			try {
				const featurePolygon = turfPolygon(feature.geometry.coordinates);
				const featureCenter = turfCentroid(featurePolygon);
				if (turfBooleanPointInPolygon(featureCenter, polygon)) {
					parcelsInPolygon.push(feature.properties.parcelId);
				}
			} catch (e) {}
		});

		return {
			areaHectares: parseFloat(areaHectares.toFixed(2)),
			parcels: parcelsInPolygon,
			treeSpecies: Object.entries(speciesDistribution).map(
				([species, area]) => ({
					species,
					areaHectares: parseFloat(area.toFixed(2)),
					percentage: parseFloat(((area / areaHectares) * 100).toFixed(1)),
				}),
			),
			totalForestAreaHectares: parseFloat(totalForestArea.toFixed(2)),
			forestCoverage: parseFloat(
				((totalForestArea / areaHectares) * 100).toFixed(1),
			),
		};
	}
}
