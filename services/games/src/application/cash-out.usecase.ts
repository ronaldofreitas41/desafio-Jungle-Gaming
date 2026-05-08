import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { RoundRepository, BetRepository } from "../domain/game.repository";
import { RoundStatus } from "../domain/round.entity";
import { Bet, BetStatus } from "../domain/bet.entity";

// Use Case responsável pelo saque (cash out) do jogador durante a rodada.
@Injectable()
export class CashOutUseCase {
  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly betRepository: BetRepository,
  ) {}

  async execute(playerId: string, currentMultiplier: number): Promise<Bet> {
    // 1. Busca a rodada atual
    const round = await this.roundRepository.findCurrent();
    if (!round || round.status !== RoundStatus.RUNNING) {
      throw new BadRequestException("No active round running for cash out");
    }

    // 2. Busca a aposta do jogador na rodada atual
    const bet = await this.betRepository.findByPlayerAndRound(playerId, round.id);
    if (!bet) {
      throw new NotFoundException("No bet found for this user in the current round");
    }

    // 3. Valida se a aposta ainda está pendente
    if (bet.status !== BetStatus.PENDING) {
      throw new BadRequestException("Bet is already settled");
    }

    // 4. Valida se o multiplicador de saque é válido (não crashou ainda)
    if (currentMultiplier >= round.crashPoint) {
       // Em um cenário real, se o pedido de cashout chegar depois do crash, ele perde.
       throw new BadRequestException("Round already crashed");
    }

    // 5. Realiza o cashout na entidade de domínio
    bet.cashOut(currentMultiplier);

    // 6. Persiste a alteração
    const updatedBet = await this.betRepository.update(bet);

    // TODO: Disparar evento para o Wallet Service creditar os ganhos (payout).

    return updatedBet;
  }
}
