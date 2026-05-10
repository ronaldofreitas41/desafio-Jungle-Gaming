import { Module } from "@nestjs/common";
import { WalletController } from "./presentation/controllers/wallets.controller";
import { GetMyWalletUseCase } from "./application/get-my-wallet.usecase";
import { CreateWalletUseCase } from "./application/create-wallet.usecase";
import { WalletRepository } from "./domain/wallet.repository";
import { PrismaWalletRepository } from "./infrastructure/prisma-wallet.repository";
import { DebitWalletUseCase } from "./application/debit-wallet.usecase";
import { CreditWalletUseCase } from "./application/credit-wallet.usecase";
import { WalletMessageController } from "./presentation/controllers/wallet-message.controller";

@Module({
  controllers: [WalletController, WalletMessageController],
  providers: [
    GetMyWalletUseCase,
    CreateWalletUseCase,
    DebitWalletUseCase,
    CreditWalletUseCase,
    { provide: WalletRepository, useClass: PrismaWalletRepository },
  ],
})
export class WalletModule {}