import { Injectable, NotFoundException } from "@nestjs/common";
import { WalletRepository } from "../domain/wallet.repository";
import { Wallet } from "../domain/wallet.entity";

// Use Case responsável por adicionar saldo à conta do usuário (ex: após ganhar uma rodada)
@Injectable()
export class CreditWalletUseCase {
  constructor(private readonly walletRepository: WalletRepository) {}

  async execute(userId: string, amount: bigint): Promise<Wallet> {
    // Busca a carteira do usuário no banco de dados
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException("Carteira não encontrada para este usuário");
    }

    // Adiciona o saldo e persiste a alteração no banco
    wallet.credit(amount);
    return await this.walletRepository.save(wallet);
  }
}
