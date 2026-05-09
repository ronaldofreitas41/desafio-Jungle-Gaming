// O RoundStatus representa o estado atual de uma rodada no jogo.
export enum RoundStatus {
  BETTING = "BETTING",
  RUNNING = "RUNNING",
  CRASHED = "CRASHED",
  FINISHED = "FINISHED"
}

// A entidade Round é o Agregado Principal (Aggregate Root) que gerencia o ciclo de vida da rodada.
export class Round {
  constructor(
    public readonly id: string,
    public status: RoundStatus,
    public readonly crashPoint: number,
    public readonly serverSeed: string,
    public readonly serverSeedHash: string,
    public startedAt?: Date,
    public crashedAt?: Date,
    public createdAt: Date = new Date(),
  ) { }

  // Inicia a rodada, mudando o status de BETTING para RUNNING
  start() {
    if (this.status !== RoundStatus.BETTING) {
      throw new Error("A rodada só pode começar a partir do status de APOSTAS");
    }
    this.status = RoundStatus.RUNNING;
    this.startedAt = new Date();
  }

  // Finaliza a rodada com o crash
  crash() {
    if (this.status !== RoundStatus.RUNNING) {
      throw new Error("A rodada só pode crashar a partir do status de EXECUÇÃO");
    }
    this.status = RoundStatus.CRASHED;
    this.crashedAt = new Date();
  }

  // Finaliza o processamento da rodada
  finish() {
    if (this.status !== RoundStatus.CRASHED) {
      throw new Error("A rodada só pode ser finalizada após o status de CRASHED");
    }
    this.status = RoundStatus.FINISHED;
  }

  // Verifica se o multiplicador atual já passou do ponto de crash
  hasCrashed(currentMultiplier: number): boolean {
    return currentMultiplier >= this.crashPoint;
  }
}
