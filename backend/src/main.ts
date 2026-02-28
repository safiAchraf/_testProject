import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: process.env.FRONTEND_URL || "http://localhost:3000",
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		}),
	);

	const config = new DocumentBuilder()
		.setTitle("Forest Geospatial API")
		.setDescription("API for French Forest Data Visualization")
		.setVersion("1.0")
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api", app, document);

	const port = process.env.PORT || 3001;
	await app.listen(port);
	console.log(`Server running on http://localhost:${port}`);
	console.log(`API docs: http://localhost:${port}/api`);
}
bootstrap();
