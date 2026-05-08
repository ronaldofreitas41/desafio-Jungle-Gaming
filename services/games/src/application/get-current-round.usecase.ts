import { Injectable } from "@nestjs/common";
import { RoundRepository, BetRepository } from "../domain/game.repository";
import { Round } from "../domain/round.entity";
import { Bet } from "../domain/bet.entity";

// DTO de saída do Use Case para facilitar o consumo
export interface CurrentRoundOutput {
  round: Round;
  bets: Bet[];
}

// Use Case responsável por buscar a rodada atual e suas apostas.
@Injectable()
export class GetCurrentRoundUseCase {
  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly betRepository: BetRepository,
  ) {}

  async execute(): Promise<CurrentRoundOutput | null> {
    const round = await this.roundRepository.findCurrent();
    if (!round) return null;

    const bets = await this.betRepository.findByRoundId(round.id);

    return { round, bets };
  }
}
