import { Injectable } from "@nestjs/common";
import { WalletRepository } from "../domain/wallet.repository";
import { Wallet } from "../domain/wallet.entity";
import { PrismaService } from "./prisma.service";

// Esta é a implementação CONCRETA do contrato definido no domínio.
// É aqui que o Prisma (detalhe de infraestrutura) é usado de verdade.
// O domínio e a aplicação nunca importam esta classe diretamente,
// apenas o contrato abstrato WalletRepository.
@Injectable()
export class PrismaWalletRepository implements WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Wallet | null> {
    // Busca o registro cru do banco via Prisma
    const row = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!row) return null;

    // Converte o objeto do Prisma (row) para a entidade do domínio (Wallet)
    // Isso é chamado de mapeamento — mantém o domínio independente do Prisma
    return new Wallet(row.id, row.userId, row.balance);
  }

  async create(wallet: Wallet): Promise<Wallet> {
    // Recebe a entidade do domínio e persiste no banco
    const row = await this.prisma.wallet.create({
      data: {
        id: wallet.id,
        userId: wallet.userId,
        balance: wallet.balance,
      },
    });

    // Retorna uma entidade do domínio, nunca o objeto bruto do Prisma
    return new Wallet(row.id, row.userId, row.balance);
  }

  async save(wallet: Wallet): Promise<Wallet> {
    // Atualiza apenas os campos mutáveis (balance)
    // id e userId são imutáveis após a criação
    const row = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: wallet.balance },
    });

    return new Wallet(row.id, row.userId, row.balance);
  }
}