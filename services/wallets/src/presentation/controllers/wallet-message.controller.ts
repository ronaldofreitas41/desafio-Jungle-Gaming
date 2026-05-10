import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { DebitWalletUseCase } from '../../application/debit-wallet.usecase';
import { CreditWalletUseCase } from '../../application/credit-wallet.usecase';
import { GetMyWalletUseCase } from '../../application/get-my-wallet.usecase';

// Controller que processa mensagens assíncronas vindas do RabbitMQ
@Controller()
export class WalletMessageController {
  constructor(
    private readonly debitWalletUseCase: DebitWalletUseCase,
    private readonly creditWalletUseCase: CreditWalletUseCase,
    private readonly getMyWalletUseCase: GetMyWalletUseCase,
  ) { }

  // Ouve solicitações de débito de saldo (ex: quando um jogador faz uma aposta)
  @EventPattern('wallet.debit')
  async handleDebit(@Payload() data: { playerId: string; amount: string; referenceId: string }) {
    console.log(`Recebida solicitação de débito para o jogador ${data.playerId}: ${data.amount}`);
    try {
      await this.debitWalletUseCase.execute(data.playerId, BigInt(data.amount));
    } catch (error) {
      console.error(`Falha ao debitar carteira: ${error.message}`);
    }
  }

  // Ouve solicitações de crédito de saldo (ex: quando um jogador ganha uma rodada)
  @EventPattern('wallet.credit')
  async handleCredit(@Payload() data: { playerId: string; amount: string; referenceId: string }) {
    console.log(`Recebida solicitação de crédito para o jogador ${data.playerId}: ${data.amount}`);
    try {
      await this.creditWalletUseCase.execute(data.playerId, BigInt(data.amount));
    } catch (error) {
      console.error(`Falha ao creditar carteira: ${error.message}`);
    }
  }

  // Responde a solicitações síncronas de consulta de saldo
  @MessagePattern('wallet.get_balance')
  async getBalance(@Payload() data: { playerId: string }) {
    try {
      const wallet = await this.getMyWalletUseCase.execute(data.playerId);
      return { balance: wallet.balance.toString() }; // Retorna saldo como string para evitar problemas com JSON/BigInt
    } catch (error) {
      return { balance: "0" };
    }
  }
}
