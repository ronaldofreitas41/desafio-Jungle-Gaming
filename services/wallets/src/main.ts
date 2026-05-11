import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { Transport, MicroserviceOptions } from '@nestjs/microservices'
import { ValidationPipe } from '@nestjs/common'
import { config } from 'dotenv'

config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Configura o Microserviço RabbitMQ
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672'],
      queue: 'wallet_queue',
      queueOptions: {
        durable: false
      },
    },
  });

  await app.startAllMicroservices();

  const config = new DocumentBuilder()
    .setTitle('Crash Game API')
    .setDescription('API do crash game')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  
  SwaggerModule.setup('docs', app, document)
  const port = process.env.PORT || 4001
  
  await app.listen(port, () => {
    console.log(`Wallets service is running on port ${port}`)
  })
}

bootstrap()