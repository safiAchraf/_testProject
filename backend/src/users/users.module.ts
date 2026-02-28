import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UsersResolver } from "./users.resolver";
import { User } from "./entities/user.entity";
import { MapState } from "./entities/map-state.entity";

@Module({
	imports: [TypeOrmModule.forFeature([User, MapState])],
	controllers: [UsersController],
	providers: [UsersService, UsersResolver],
	exports: [UsersService],
})
export class UsersModule {}
