import { Module } from "@nestjs/common";
import { AuthModule } from "./infrastructure/auth/auth.module";
import { PrismaModule } from "./infrastructure/prisma.module";
import { WalletModule } from "./wallet.module";

@Module({
  imports: [PrismaModule, AuthModule, WalletModule],
})
export class AppModule {}