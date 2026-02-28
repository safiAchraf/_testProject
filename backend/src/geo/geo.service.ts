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
import { REGIONS } from "./data/regions";
import {
	getDepartmentsByRegionId,
	getDepartmentById,
} from "./data/departments";

const GEO_API = "https://geo.api.gouv.fr";

@Injectable()
export class GeoService {
	private readonly logger = new Logger(GeoService.name);

	constructor(
		@InjectRepository(ForestZone)
		private readonly forestRepo: Repository<ForestZone>,
	) {}

	async getRegions() {
		return REGIONS;
	}

	async getDepartmentsByRegion(regionId: string) {
		return getDepartmentsByRegionId(regionId);
	}

	async getCommunesByDepartment(departmentId: string) {
		try {
			const res = await fetch(
				`${GEO_API}/departements/${departmentId}/communes?fields=centre,nom,code`,
			);
			if (!res.ok) return [];
			const data = await res.json();
			return data.map((c: any) => ({
				id: c.code,
				name: c.nom,
				center: c.centre
					? { lng: c.centre.coordinates[0], lat: c.centre.coordinates[1] }
					: { lng: 0, lat: 0 },
			}));
		} catch {
			this.logger.warn(
				`Failed to fetch communes for department ${departmentId}`,
			);
			return [];
		}
	}

	async getForestDataByZone(zoneId: string, zoneType: string) {
		let bbox: number[] | null = null;

		if (zoneType === "region") {
			const region = REGIONS.find((r) => r.id === zoneId);
			if (region) bbox = region.bbox;
		} else if (zoneType === "department") {
			const dept = getDepartmentById(zoneId);
			if (dept) bbox = dept.bbox;
		}

		if (bbox) {
			return this.getForestByBbox(bbox, 5000);
		}

		return { type: "FeatureCollection", features: [] };
	}

	async getCadastreByBounds(bounds: number[]) {
		return { type: "FeatureCollection", features: [] };
	}

	async getForestByBbox(bounds: number[], limit = 2000, zoom = 10) {
		const [minLng, minLat, maxLng, maxLat] = bounds;

		let tolerance = 0;
		if (zoom < 10) tolerance = 0.005;
		else if (zoom < 12) tolerance = 0.002;
		else if (zoom < 14) tolerance = 0.0005;

		const geomSelect =
			tolerance > 0
				? `ST_AsGeoJSON(ST_Simplify(fz.geom, ${tolerance}))`
				: `ST_AsGeoJSON(fz.geom)`;

		const rows = await this.forestRepo
			.createQueryBuilder("fz")
			.select([
				"fz.id",
				"fz.osmId",
				"fz.name",
				"fz.species",
				"fz.forestType",
				"fz.density",
				"fz.height",
				"fz.areaHa",
			])
			.addSelect(geomSelect, "geojson")
			.where(
				"ST_Intersects(fz.geom, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))",
				{ minLng, minLat, maxLng, maxLat },
			)
			.limit(limit)
			.getRawMany();

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
					id: `forest-${r.fz_id}`,
					geometry,
					properties: {
						species: r.fz_species,
						type: r.fz_forestType,
						density: r.fz_density,
						height: r.fz_height,
						area_ha: r.fz_areaHa,
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
		const rows = await this.forestRepo
			.createQueryBuilder("fz")
			.select([
				"fz.id",
				"fz.osmId",
				"fz.name",
				"fz.species",
				"fz.forestType",
				"fz.density",
				"fz.height",
				"fz.areaHa",
			])
			.addSelect("ST_AsGeoJSON(fz.geom)", "geojson")
			.where(
				"ST_Intersects(fz.geom, ST_SetSRID(ST_GeomFromGeoJSON(:polygon), 4326))",
				{ polygon: JSON.stringify(polygonGeoJSON) },
			)
			.getRawMany();

		return rows.map((r) => ({
			type: "Feature",
			id: `forest-${r.fz_id}`,
			geometry: JSON.parse(r.geojson),
			properties: {
				species: r.fz_species,
				type: r.fz_forestType,
				density: r.fz_density,
				height: r.fz_height,
				area_ha: r.fz_areaHa,
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
