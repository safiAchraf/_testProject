import {
	Controller,
	Post,
	Body,
	UseGuards,
	Request,
	Get,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post("register")
	@ApiOperation({ summary: "Register a new user" })
	async register(@Body() createUserDto: CreateUserDto) {
		return this.authService.register(createUserDto);
	}

	@Post("login")
	@ApiOperation({ summary: "Login user" })
	async login(@Body() loginDto: LoginDto) {
		return this.authService.login(loginDto);
	}

	@Get("profile")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get current user profile" })
	async getProfile(@Request() req) {
		return this.authService.getProfile(req.user.userId);
	}
}
