import { Module } from "@nestjs/common";
import { PrismaModule } from "./infrastructure/prisma.module";
import { WalletModule } from "./wallet.module";

@Module({
  imports: [PrismaModule, WalletModule],
})
export class AppModule {}