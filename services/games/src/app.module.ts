import { Module } from "@nestjs/common";
import { AuthModule } from "./infrastructure/auth/auth.module";
import { PrismaModule } from "./infrastructure/prisma.module";
import { GameModule } from "./game.module";

@Module({
  imports: [PrismaModule, AuthModule, GameModule],
})
export class AppModule {}
