import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	UseGuards,
	Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UpdateMapStateDto } from "./dto/update-map-state.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("users")
@Controller("users")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get all users" })
	findAll() {
		return this.usersService.findAll();
	}

	@Get(":id")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get user by ID" })
	findOne(@Param("id") id: string) {
		return this.usersService.findOne(id);
	}

	@Get(":id/map-state")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get user map state" })
	getMapState(@Param("id") id: string) {
		return this.usersService.getMapState(id);
	}

	@Put(":id/map-state")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Update user map state" })
	updateMapState(
		@Param("id") id: string,
		@Body() updateMapStateDto: UpdateMapStateDto,
	) {
		return this.usersService.updateMapState(id, updateMapStateDto);
	}

	@Delete(":id")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Delete user" })
	remove(@Param("id") id: string) {
		return this.usersService.remove(id);
	}
}
