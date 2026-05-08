import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { config } from "dotenv";

// Carrega variáveis de ambiente do arquivo .env
config();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Habilita validação global de DTOs usando class-validator
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Configuração do Swagger para documentação da API
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Crash Game - Games Service")
    .setDescription("API do serviço de jogos da Jungle Gaming")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT || 4001;
  await app.listen(port, "0.0.0.0");
  
  console.log(`Games service is running on port ${port}`);
}

bootstrap();
