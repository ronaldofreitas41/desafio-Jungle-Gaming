import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { config } from 'dotenv'

config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

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