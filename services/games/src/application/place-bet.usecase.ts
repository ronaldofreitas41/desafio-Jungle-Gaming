import { Injectable, BadRequestException, ConflictException } from "@nestjs/common";
import { RoundRepository, BetRepository } from "../domain/game.repository";
import { Bet } from "../domain/bet.entity";
import { RoundStatus } from "../domain/round.entity";
import { randomUUID } from "crypto";

// Use Case responsável por registrar uma nova aposta.
@Injectable()
export class PlaceBetUseCase {
  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly betRepository: BetRepository,
  ) {}

  async execute(playerId: string, username: string, amount: bigint): Promise<Bet> {
    // 1. Busca a rodada atual
    const round = await this.roundRepository.findCurrent();
    if (!round) {
      throw new BadRequestException("No active round available");
    }

    // 2. Valida se a rodada está em fase de apostas
    if (round.status !== RoundStatus.BETTING) {
      throw new BadRequestException("Bets are only allowed during BETTING phase");
    }

    // 3. Valida limites de aposta (Ex: 1.00 a 1000.00 -> 100 a 100000 centavos)
    if (amount < 100n || amount > 100000n) {
      throw new BadRequestException("Bet amount must be between 1.00 and 1000.00");
    }

    // 4. Verifica se o jogador já apostou nesta rodada
    const existingBet = await this.betRepository.findByPlayerAndRound(playerId, round.id);
    if (existingBet) {
      throw new ConflictException("User already has a bet in this round");
    }

    // 5. Cria a nova aposta
    const bet = new Bet(
      randomUUID(),
      round.id,
      playerId,
      username,
      amount
    );

    // TODO: Aqui deveria disparar um evento para o Wallet Service debitar o saldo.
    // Por enquanto, apenas salvamos no Game Service.

    return this.betRepository.create(bet);
  }
}
