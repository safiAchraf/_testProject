import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GeoService } from "./geo.service";
import { GeoController } from "./geo.controller";
import { ForestZone } from "./entities/forest-zone.entity";

@Module({
	imports: [TypeOrmModule.forFeature([ForestZone])],
	controllers: [GeoController],
	providers: [GeoService],
	exports: [GeoService],
})
export class GeoModule {}
