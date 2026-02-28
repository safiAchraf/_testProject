import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Query,
	UseGuards,
} from "@nestjs/common";
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
} from "@nestjs/swagger";
import { GeoService } from "./geo.service";
import { AnalyzePolygonDto } from "./dto/analyze-polygon.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("geo")
@Controller("geo")
export class GeoController {
	constructor(private readonly geoService: GeoService) {}

	@Get("regions")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get all French regions" })
	getRegions() {
		return this.geoService.getRegions();
	}

	@Get("departments/:regionId")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get departments by region" })
	getDepartments(@Param("regionId") regionId: string) {
		return this.geoService.getDepartmentsByRegion(regionId);
	}

	@Get("communes/:departmentId")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get communes by department" })
	getCommunes(@Param("departmentId") departmentId: string) {
		return this.geoService.getCommunesByDepartment(departmentId);
	}

	@Get("forest/bbox")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get forest data within bounding box" })
	@ApiQuery({
		name: "bounds",
		required: true,
		description: "minLng,minLat,maxLng,maxLat",
	})
	@ApiQuery({
		name: "limit",
		required: false,
		description: "Max features to return",
	})
	@ApiQuery({
		name: "zoom",
		required: false,
		description: "Map zoom level (controls geometry simplification)",
	})
	getForestByBbox(
		@Query("bounds") bounds: string,
		@Query("limit") limit?: string,
		@Query("zoom") zoom?: string,
	) {
		const boundsArray = bounds.split(",").map(Number);
		return this.geoService.getForestByBbox(
			boundsArray,
			limit ? parseInt(limit) : 2000,
			zoom ? parseInt(zoom) : 10,
		);
	}

	@Get("forest/:zoneId")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get BD Forêt data for a zone" })
	@ApiQuery({ name: "type", required: false })
	getForestData(@Param("zoneId") zoneId: string, @Query("type") type?: string) {
		return this.geoService.getForestDataByZone(zoneId, type || "region");
	}

	@Get("cadastre")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get cadastre parcels by bounds" })
	@ApiQuery({
		name: "bounds",
		required: true,
		description: "minLng,minLat,maxLng,maxLat",
	})
	getCadastre(@Query("bounds") bounds: string) {
		const boundsArray = bounds.split(",").map(Number);
		return this.geoService.getCadastreByBounds(boundsArray);
	}

	@Post("analyze-polygon")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Analyze a drawn polygon for forest statistics" })
	analyzePolygon(@Body() analyzePolygonDto: AnalyzePolygonDto) {
		return this.geoService.analyzePolygon(analyzePolygonDto);
	}
}
