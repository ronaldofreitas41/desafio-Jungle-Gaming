import { Injectable, NotFoundException } from "@nestjs/common";
import { WalletRepository } from "../domain/wallet.repository";
import { Wallet } from "../domain/wallet.entity";

// Um Use Case representa UMA ação específica do sistema.
// Ele orquestra o fluxo: busca dados, aplica regras, retorna resultado.
// Não sabe nada sobre HTTP, JSON ou banco de dados.
@Injectable()
export class GetMyWalletUseCase {
  // O repositório é injetado como abstração (contrato),
  // não como implementação concreta (Prisma).
  // Isso é o princípio da inversão de dependência (DIP).
  constructor(private readonly walletRepository: WalletRepository) {}

  async execute(userId: string): Promise<Wallet> {
    // Busca a carteira pelo userId
    const wallet = await this.walletRepository.findByUserId(userId);

    // Regra de aplicação: se não existir, lança erro 404
    if (!wallet) throw new NotFoundException("Carteira não encontrada");

    return wallet;
  }
}