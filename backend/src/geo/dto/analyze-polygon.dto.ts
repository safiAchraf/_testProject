import { IsObject, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AnalyzePolygonDto {
	@ApiProperty({
		description: "GeoJSON Polygon geometry",
		example: {
			type: "Polygon",
			coordinates: [
				[
					[2.3, 48.8],
					[2.4, 48.8],
					[2.4, 48.9],
					[2.3, 48.9],
					[2.3, 48.8],
				],
			],
		},
	})
	@IsObject()
	geometry: {
		type: string;
		coordinates: number[][][];
	};

	@ApiProperty({ required: false })
	@IsOptional()
	filters?: any;
}
