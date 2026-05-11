import { Injectable, BadRequestException, NotFoundException, Inject } from "@nestjs/common";
import { RoundRepository, BetRepository } from "../domain/game.repository";
import { RoundStatus } from "../domain/round.entity";
import { ClientProxy } from "@nestjs/microservices";
import { GameGateway } from "../presentation/game.gateway";
import { Bet, BetStatus } from "../domain/bet.entity";

// Use Case responsável pelo saque (cash out) do jogador durante a rodada.
@Injectable()
export class CashOutUseCase {
  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly betRepository: BetRepository,
    private readonly gameGateway: GameGateway,
    @Inject('WALLET_SERVICE') private readonly walletClient: ClientProxy,
  ) { }

  // Executa o saque manual de uma aposta ativa
  async execute(playerId: string, currentMultiplier: number): Promise<Bet> {
    // Busca rodada em execução
    const round = await this.roundRepository.findCurrent();
    if (!round || round.status !== RoundStatus.RUNNING) {
      throw new BadRequestException("Nenhuma rodada ativa em execução para saque");
    }

    // Busca a aposta ativa do jogador nesta rodada
    const bet = await this.betRepository.findByPlayerAndRound(playerId, round.id);
    if (!bet) {
      throw new NotFoundException("Nenhuma aposta encontrada para este usuário na rodada atual");
    }

    // Verifica se a aposta ainda não foi finalizada
    if (bet.status !== BetStatus.PENDING) {
      throw new BadRequestException("A aposta já foi finalizada");
    }

    // Bloqueia saque se o multiplicador solicitado for maior que o crash point
    if (currentMultiplier >= round.crashPoint) {
      throw new BadRequestException("A rodada já crashou");
    }

    bet.cashOut(currentMultiplier); // Atualiza status e calcula payout

    // Envia evento de crédito para o serviço de carteira
    this.walletClient.emit('wallet.credit', {
      playerId,
      amount: bet.payout!.toString(),
      referenceId: bet.id,
      metadata: { roundId: round.id, multiplier: currentMultiplier.toString() }
    });

    // Notifica todos os jogadores via WebSocket
    this.gameGateway.broadcast('bet:cashout', {
      betId: bet.id,
      roundId: round.id,
      playerId,
      status: 'won',
      multiplier: currentMultiplier,
      profit: Number(bet.payout! - bet.amount),
    });

    // Salva a aposta atualizada
    return this.betRepository.update(bet);
  }
}
