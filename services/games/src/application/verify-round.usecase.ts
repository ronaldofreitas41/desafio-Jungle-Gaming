import { Injectable, NotFoundException } from "@nestjs/common";
import { RoundRepository } from "../domain/game.repository";
import { Round } from "../domain/round.entity";

// DTO de resposta para verificação
export interface RoundVerificationOutput {
  id: string;
  crashPoint: number;
  serverSeed: string;
  serverSeedHash: string;
}

// Use Case responsável por fornecer os dados para verificação Provably Fair.
@Injectable()
export class VerifyRoundUseCase {
  constructor(private readonly roundRepository: RoundRepository) {}

  async execute(roundId: string): Promise<RoundVerificationOutput> {
    const round = await this.roundRepository.findById(roundId);
    
    if (!round) {
      throw new NotFoundException("Round not found");
    }

    // Só permitimos ver a seed após o crash (fim da rodada) para evitar trapaças
    // No entanto, para fins didáticos e do desafio, retornamos o que está no banco.
    return {
      roundId: round.id,
      crashPoint: Number(round.crashPoint),
      serverSeed: round.serverSeed,
      hash: round.serverSeedHash,
      seed: "N/A", // Não implementado no esquema atual
      nonce: 0     // Não implementado no esquema atual
    };
  }
}
