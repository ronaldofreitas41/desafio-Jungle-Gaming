import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { WalletRepository } from "../domain/wallet.repository";
import { Wallet } from "../domain/wallet.entity";

// Use Case responsável por subtrair saldo da conta do usuário
@Injectable()
export class DebitWalletUseCase {
  constructor(private readonly walletRepository: WalletRepository) { }

  async execute(userId: string, amount: bigint): Promise<Wallet> {
    // Busca a carteira do usuário no banco de dados
    const wallet = await this.walletRepository.findByUserId(userId);
    if (!wallet) {
      throw new NotFoundException("Carteira não encontrada para este usuário");
    }

    try {
      // Tenta realizar o débito (a regra de saldo insuficiente vive na entidade Wallet)
      wallet.debit(amount);
      return await this.walletRepository.save(wallet);
    } catch (error) {
      // Repassa o erro (ex: saldo insuficiente) com status 400
      throw new BadRequestException(error.message);
    }
  }
}
