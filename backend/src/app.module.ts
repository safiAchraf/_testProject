import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { GeoModule } from "./geo/geo.module";
import { getTypeOrmConfig } from "./config/typeorm.config";

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: getTypeOrmConfig,
			inject: [ConfigService],
		}),
		GraphQLModule.forRoot<ApolloDriverConfig>({
			driver: ApolloDriver,
			autoSchemaFile: join(process.cwd(), "src/schema.gql"),
			sortSchema: true,
			playground: true,
			context: ({ req }) => ({ req }),
		}),
		AuthModule,
		UsersModule,
		GeoModule,
	],
})
export class AppModule {}
