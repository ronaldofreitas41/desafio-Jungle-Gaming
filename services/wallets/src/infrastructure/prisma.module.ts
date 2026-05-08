import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

// @Global() faz com que o PrismaService esteja disponível em toda a aplicação
// sem precisar importar o PrismaModule em cada módulo
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}