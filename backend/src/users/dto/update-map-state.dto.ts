import { IsOptional, IsNumber, IsArray, IsString } from "class-validator";
import { InputType, Field, Float } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@InputType()
export class UpdateMapStateDto {
	@ApiProperty({ required: false })
	@Field(() => Float, { nullable: true })
	@IsOptional()
	@IsNumber()
	latitude?: number;

	@ApiProperty({ required: false })
	@Field(() => Float, { nullable: true })
	@IsOptional()
	@IsNumber()
	longitude?: number;

	@ApiProperty({ required: false })
	@Field(() => Float, { nullable: true })
	@IsOptional()
	@IsNumber()
	zoom?: number;

	@ApiProperty({ required: false })
	@Field(() => [String], { nullable: true })
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	activeFilters?: string[];

	@ApiProperty({ required: false })
	@Field(() => [String], { nullable: true })
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	visibleLayers?: string[];

	@ApiProperty({ required: false })
	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	selectedRegion?: string;

	@ApiProperty({ required: false })
	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	selectedDepartment?: string;

	@ApiProperty({ required: false })
	@Field({ nullable: true })
	@IsOptional()
	@IsString()
	selectedCommune?: string;
}
