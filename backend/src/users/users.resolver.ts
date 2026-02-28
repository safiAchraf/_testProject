import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { MapState } from "./entities/map-state.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateMapStateDto } from "./dto/update-map-state.dto";
import { GqlAuthGuard } from "../auth/guards/gql-auth.guard";

@Resolver(() => User)
export class UsersResolver {
	constructor(private readonly usersService: UsersService) {}

	@Mutation(() => User)
	async createUser(@Args("createUserInput") createUserDto: CreateUserDto) {
		return this.usersService.create(createUserDto);
	}

	@Query(() => [User], { name: "users" })
	@UseGuards(GqlAuthGuard)
	findAll() {
		return this.usersService.findAll();
	}

	@Query(() => User, { name: "user" })
	@UseGuards(GqlAuthGuard)
	findOne(@Args("id") id: string) {
		return this.usersService.findOne(id);
	}

	@Mutation(() => MapState)
	@UseGuards(GqlAuthGuard)
	updateMapState(
		@Args("userId") userId: string,
		@Args("updateMapStateInput") updateMapStateDto: UpdateMapStateDto,
	) {
		return this.usersService.updateMapState(userId, updateMapStateDto);
	}

	@Query(() => MapState, { name: "mapState" })
	@UseGuards(GqlAuthGuard)
	getMapState(@Args("userId") userId: string) {
		return this.usersService.getMapState(userId);
	}

	@Mutation(() => Boolean)
	@UseGuards(GqlAuthGuard)
	async removeUser(@Args("id") id: string) {
		await this.usersService.remove(id);
		return true;
	}
}
