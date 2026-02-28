import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { CreateUserDto } from "../users/dto/create-user.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
	) {}

	async validateUser(email: string, password: string): Promise<any> {
		const user = await this.usersService.findByEmail(email);

		if (!user) {
			return null;
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return null;
		}

		const { password: _, ...result } = user;
		return result;
	}

	async login(loginDto: LoginDto) {
		const user = await this.validateUser(loginDto.email, loginDto.password);

		if (!user) {
			throw new UnauthorizedException("Invalid credentials");
		}

		const payload = { email: user.email, sub: user.id };

		return {
			access_token: this.jwtService.sign(payload),
			user: {
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
			},
		};
	}

	async register(createUserDto: CreateUserDto) {
		const existingUser = await this.usersService.findByEmail(
			createUserDto.email,
		);

		if (existingUser) {
			throw new UnauthorizedException("Email already exists");
		}

		const user = await this.usersService.create(createUserDto);
		const { password, ...result } = user;

		const payload = { email: result.email, sub: result.id };

		return {
			access_token: this.jwtService.sign(payload),
			user: result,
		};
	}

	async getProfile(userId: string) {
		return this.usersService.findOne(userId);
	}
}
