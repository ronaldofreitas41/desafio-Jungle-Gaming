import { Module } from "@nestjs/common";
import { WalletController } from "./presentation/controllers/wallets.controller";
import { GetMyWalletUseCase } from "./application/get-my-wallet.usecase";
import { CreateWalletUseCase } from "./application/create-wallet.usecase";
import { WalletRepository } from "./domain/wallet.repository";
import { PrismaWalletRepository } from "./infrastructure/prisma-wallet.repository";

@Module({
  controllers: [WalletController],
  providers: [
    GetMyWalletUseCase,
    CreateWalletUseCase,
    { provide: WalletRepository, useClass: PrismaWalletRepository },
  ],
})
export class WalletModule {}