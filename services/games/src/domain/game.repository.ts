import { Round } from "./round.entity";
import { Bet } from "./bet.entity";

// Interface que define as operações permitidas no repositório de rodadas.
// Segue o princípio de inversão de dependência (D do SOLID).
export abstract class RoundRepository {
  abstract findById(id: string): Promise<Round | null>;
  abstract findCurrent(): Promise<Round | null>;
  abstract findHistory(page: number, limit: number): Promise<Round[]>;
  abstract create(round: Round): Promise<Round>;
  abstract update(round: Round): Promise<Round>;
}

// Interface que define as operações permitidas no repositório de apostas.
export abstract class BetRepository {
  abstract findById(id: string): Promise<Bet | null>;
  abstract findByRoundId(roundId: string): Promise<Bet[]>;
  abstract findByPlayerId(playerId: string, page: number, limit: number): Promise<Bet[]>;
  abstract findByPlayerAndRound(playerId: string, roundId: string): Promise<Bet | null>;
  abstract create(bet: Bet): Promise<Bet>;
  abstract update(bet: Bet): Promise<Bet>;
}
