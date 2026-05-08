// O BetStatus representa o estado de uma aposta individual.
export enum BetStatus {
  PENDING = "PENDING",
  CASHED_OUT = "CASHED_OUT",
  LOST = "LOST"
}

// A entidade Bet representa uma aposta feita por um jogador em uma rodada específica.
export class Bet {
  constructor(
    public readonly id: string,
    public readonly roundId: string,
    public readonly playerId: string,
    public readonly username: string,
    public readonly amount: bigint,
    public status: BetStatus = BetStatus.PENDING,
    public cashoutMultiplier?: number,
    public payout?: bigint,
    public readonly createdAt: Date = new Date(),
  ) { }

  // Realiza o cashout da aposta
  cashOut(multiplier: number) {
    if (this.status !== BetStatus.PENDING) {
      throw new Error("Only pending bets can be cashed out");
    }

    this.status = BetStatus.CASHED_OUT;
    this.cashoutMultiplier = multiplier;

    // Cálculo do payout: (valor * multiplicador). 
    // Como BigInt não suporta decimais, multiplicamos por 100, multiplicamos pelo multiplier e dividimos por 100.
    // Ou simplesmente: BigInt(Math.floor(Number(this.amount) * multiplier))
    this.payout = BigInt(Math.floor(Number(this.amount) * multiplier));
  }

  // Marca a aposta como perdida
  lose() {
    if (this.status !== BetStatus.PENDING) {
      throw new Error("Only pending bets can be lost");
    }
    this.status = BetStatus.LOST;
    this.payout = 0n;
  }
}
