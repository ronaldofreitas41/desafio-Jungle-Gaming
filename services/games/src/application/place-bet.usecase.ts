import { Injectable, BadRequestException, ConflictException } from "@nestjs/common";
import { RoundRepository, BetRepository } from "../domain/game.repository";
import { Bet } from "../domain/bet.entity";
import { RoundStatus } from "../domain/round.entity";
import { randomUUID } from "crypto";
import { Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { GameGateway } from "../presentation/game.gateway";
import { firstValueFrom } from "rxjs";

// Use Case responsável por registrar uma nova aposta.
@Injectable()
export class PlaceBetUseCase {
  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly betRepository: BetRepository,
    private readonly gameGateway: GameGateway,
    @Inject('WALLET_SERVICE') private readonly walletClient: ClientProxy,
  ) { }

  // Executa o registro de uma nova aposta
  async execute(playerId: string, username: string, amount: bigint, autoCashoutMultiplier?: number): Promise<Bet> {
    // Busca a rodada atual
    const round = await this.roundRepository.findCurrent();
    if (!round) {
      throw new BadRequestException("Nenhuma rodada ativa disponível");
    }

    // Valida se a rodada aceita apostas
    if (round.status !== RoundStatus.BETTING) {
      throw new BadRequestException("Apostas só são permitidas durante a fase de APOSTAS");
    }

    // Valida limite minimo de R$1,00
    if (amount < 100n) {
      throw new BadRequestException("O valor da aposta deve ser pelomenos R$1,00");
    }

    // Consulta o saldo atual do usuário no serviço de carteira
    const walletData = await firstValueFrom(
      this.walletClient.send<{ balance: string }>('wallet.get_balance', { playerId })
    );
    const balance = BigInt(walletData.balance);

    // Valida se o saldo é suficiente para a aposta
    if (amount > balance) {
      throw new BadRequestException(`Saldo insuficiente. Seu saldo atual é R$ ${(Number(balance) / 100).toFixed(2)}`);
    }

    // Impede múltiplas apostas do mesmo jogador na mesma rodada
    const existingBet = await this.betRepository.findByPlayerAndRound(playerId, round.id);
    if (existingBet) {
      throw new ConflictException("O usuário já possui uma aposta nesta rodada");
    }

    // Instancia a nova aposta
    const bet = new Bet(
      randomUUID(),
      round.id,
      playerId,
      username,
      amount,
      undefined,
      undefined,
      undefined,
      undefined,
      autoCashoutMultiplier
    );

    // Solicita débito do saldo no serviço de carteira
    this.walletClient.emit('wallet.debit', {
      playerId,
      amount: amount.toString(),
      referenceId: bet.id,
      metadata: { roundId: round.id }
    });

    // Notifica todos os clientes via WebSocket
    this.gameGateway.broadcast('bet:placed', {
      id: bet.id,
      roundId: round.id,
      playerId,
      playerName: username,
      amount: Number(amount),
      status: 'pending',
      createdAt: bet.createdAt.toISOString(),
      autoCashoutMultiplier: bet.autoCashoutMultiplier,
    });

    // Persiste a aposta no banco
    return this.betRepository.create(bet);
  }
}
