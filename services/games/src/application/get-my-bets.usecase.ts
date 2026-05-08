import { Injectable } from "@nestjs/common";
import { BetRepository } from "../domain/game.repository";
import { Bet } from "../domain/bet.entity";

// Use Case responsável por buscar as apostas de um jogador específico.
@Injectable()
export class GetMyBetsUseCase {
  constructor(private readonly betRepository: BetRepository) {}

  async execute(playerId: string, page: number = 1, limit: number = 10): Promise<Bet[]> {
    const p = Math.max(1, page);
    const l = Math.min(50, Math.max(1, limit));

    return this.betRepository.findByPlayerId(playerId, p, l);
  }
}
