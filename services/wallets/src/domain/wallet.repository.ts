// O repositório no domínio é apenas um CONTRATO (interface/classe abstrata).
// Ele diz "preciso dessas operações", mas NÃO sabe como elas são implementadas.
// Isso permite trocar o banco de dados (Prisma, TypeORM, MongoDB...)

import { Wallet } from "./wallet.entity";

// sem tocar em nada do domínio ou da aplicação.
export abstract class WalletRepository {
  abstract findByUserId(userId: string): Promise<Wallet | null>;
  abstract create(wallet: Wallet): Promise<Wallet>;
  abstract save(wallet: Wallet): Promise<Wallet>;
}