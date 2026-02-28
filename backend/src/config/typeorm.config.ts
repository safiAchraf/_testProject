import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

export const getTypeOrmConfig = (
	configService: ConfigService,
): TypeOrmModuleOptions => ({
	type: "postgres",
	host: configService.get<string>("DATABASE_HOST", "localhost"),
	port: configService.get<number>("DATABASE_PORT", 5432),
	username: configService.get<string>("DATABASE_USER", "postgres"),
	password: configService.get<string>("DATABASE_PASSWORD", "postgres"),
	database: configService.get<string>("DATABASE_NAME", "postgres"),
	ssl:
		configService.get<string>("DATABASE_SSL") === "true"
			? { rejectUnauthorized: false }
			: false,
	extra: {
		...(configService.get<string>("DATABASE_IPV6") === "true"
			? { family: 6 }
			: {}),
	},
	entities: [__dirname + "/../**/*.entity{.ts,.js}"],
	synchronize: true,
	logging: configService.get<string>("NODE_ENV") === "development",
	migrations: [__dirname + "/../migrations/*{.ts,.js}"],
});
