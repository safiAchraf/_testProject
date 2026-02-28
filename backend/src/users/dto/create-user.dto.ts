import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";
import { InputType, Field } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@InputType()
export class CreateUserDto {
	@ApiProperty()
	@Field()
	@IsEmail()
	email: string;

	@ApiProperty()
	@Field()
	@IsString()
	@MinLength(2)
	@MaxLength(50)
	firstName: string;

	@ApiProperty()
	@Field()
	@IsString()
	@MinLength(2)
	@MaxLength(50)
	lastName: string;

	@ApiProperty()
	@Field()
	@IsString()
	@MinLength(6)
	password: string;
}
