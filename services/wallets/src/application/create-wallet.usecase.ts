import { Injectable, ConflictException } from "@nestjs/common";
import { WalletRepository } from "../domain/wallet.repository";
import { Wallet } from "../domain/wallet.entity";
import { randomUUID } from "crypto";

// Use Case responsável por criar uma nova carteira.
// Cada use case tem uma única responsabilidade (Single Responsibility Principle).
@Injectable()
export class CreateWalletUseCase {
  constructor(private readonly walletRepository: WalletRepository) { }

  async execute(userId: string): Promise<Wallet> {
    // Regra de negócio: um usuário só pode ter uma carteira
    const existing = await this.walletRepository.findByUserId(userId);
    if (existing) throw new ConflictException("Wallet already exists");

    // Cria a entidade Wallet com saldo inicial de 100000 centavos (R$ 1000,00)
    const wallet = new Wallet(randomUUID(), userId, 100000n);

    return this.walletRepository.create(wallet);
  }
}