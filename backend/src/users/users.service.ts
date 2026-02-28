import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { MapState } from "./entities/map-state.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateMapStateDto } from "./dto/update-map-state.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
		@InjectRepository(MapState)
		private mapStateRepository: Repository<MapState>,
	) {}

	async create(createUserDto: CreateUserDto): Promise<User> {
		const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

		const user = this.usersRepository.create({
			...createUserDto,
			password: hashedPassword,
		});

		const savedUser = await this.usersRepository.save(user);

		const mapState = this.mapStateRepository.create({
			userId: savedUser.id,
			latitude: 48.8566,
			longitude: 2.3522,
			zoom: 6,
			visibleLayers: ["forest"],
			activeFilters: [],
		});

		await this.mapStateRepository.save(mapState);

		return savedUser;
	}

	async findAll(): Promise<User[]> {
		return this.usersRepository.find({ relations: ["mapState"] });
	}

	async findOne(id: string): Promise<User> {
		const user = await this.usersRepository.findOne({
			where: { id },
			relations: ["mapState"],
		});

		if (!user) {
			throw new NotFoundException(`User with ID ${id} not found`);
		}

		return user;
	}

	async findByEmail(email: string): Promise<User | null> {
		return this.usersRepository.findOne({ where: { email } });
	}

	async updateMapState(
		userId: string,
		updateMapStateDto: UpdateMapStateDto,
	): Promise<MapState> {
		let mapState = await this.mapStateRepository.findOne({
			where: { userId },
		});

		if (!mapState) {
			mapState = this.mapStateRepository.create({
				userId,
				...updateMapStateDto,
			});
		} else {
			Object.assign(mapState, updateMapStateDto);
		}

		return this.mapStateRepository.save(mapState);
	}

	async getMapState(userId: string): Promise<MapState> {
		const mapState = await this.mapStateRepository.findOne({
			where: { userId },
		});

		if (!mapState) {
			throw new NotFoundException(`Map state for user ${userId} not found`);
		}

		return mapState;
	}

	async remove(id: string): Promise<void> {
		const result = await this.usersRepository.delete(id);
		if (result.affected === 0) {
			throw new NotFoundException(`User with ID ${id} not found`);
		}
	}
}
