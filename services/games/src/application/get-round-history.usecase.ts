import { Injectable } from "@nestjs/common";
import { RoundRepository } from "../domain/game.repository";
import { Round } from "../domain/round.entity";

// Use Case responsável por buscar o histórico de rodadas finalizadas.
@Injectable()
export class GetRoundHistoryUseCase {
  constructor(private readonly roundRepository: RoundRepository) {}

  async execute(page: number = 1, limit: number = 20): Promise<Round[]> {
    // Garante valores mínimos para paginação
    const p = Math.max(1, page);
    const l = Math.min(100, Math.max(1, limit));

    return this.roundRepository.findHistory(p, l);
  }
}
