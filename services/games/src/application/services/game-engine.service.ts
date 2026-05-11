import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { RoundRepository, BetRepository } from '../../domain/game.repository';
import { ProvablyFairService } from './provably-fair.service';
import { GameGateway } from '../../presentation/game.gateway';
import { Round, RoundStatus } from '../../domain/round.entity';
import { BetStatus } from '../../domain/bet.entity';
import { randomUUID } from 'crypto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class GameEngineService implements OnModuleInit {
  private currentMultiplier = 1.0; // Multiplicador atual da rodada
  private gameLoopInterval: NodeJS.Timer | null = null; // Intervalo do loop de execução
  private readonly TICK_RATE = 100; // Taxa de atualização (100ms)
  private readonly BETTING_DURATION = 10000; // Duração da fase de apostas (10s)
  private isEngineRunning = false; // Flag para evitar múltiplos loops

  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly betRepository: BetRepository,
    private readonly provablyFairService: ProvablyFairService,
    private readonly gameGateway: GameGateway,
    @Inject('WALLET_SERVICE') private readonly walletClient: ClientProxy,
  ) { }

  async onModuleInit() {
    if (this.isEngineRunning) return;
    this.isEngineRunning = true;
    this.runEngine(); // Inicia o motor ao carregar o módulo
  }

  // Loop infinito que gerencia as fases do jogo
  private async runEngine() {
    while (true) {
      await this.handleBettingPhase();
      await this.handleRunningPhase();
      await this.handleCrashPhase();
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Gerencia a fase inicial de apostas
  private async handleBettingPhase() {
    // Verifica se já existe uma rodada ativa para evitar duplicidade
    const existing = await this.roundRepository.findCurrent();
    if (existing) {
      console.log(`Rodada ${existing.id} já está ativa (${existing.status}). Pulando fase de criação.`);
      return;
    }

    console.log('Iniciando fase de APOSTAS');

    const serverSeed = this.provablyFairService.generateServerSeed();
    const serverSeedHash = this.provablyFairService.hashServerSeed(serverSeed);
    const clientSeed = 'default_client_seed';
    const nonce = Math.floor(Date.now() / 1000);

    const crashPoint = this.provablyFairService.calculateCrashPoint(serverSeed, clientSeed, nonce);

    const round = new Round(
      randomUUID(),
      RoundStatus.BETTING,
      crashPoint,
      serverSeed,
      serverSeedHash
    );

    await this.roundRepository.create(round);

    const bettingEndsAt = new Date(Date.now() + this.BETTING_DURATION).toISOString();

    // Notifica início da rodada e tempo restante para apostar
    this.gameGateway.broadcast('round:start', {
      roundId: round.id,
      hash: serverSeedHash,
      bettingEndsAt,
    });

    await new Promise((resolve) => setTimeout(resolve, this.BETTING_DURATION));

    // Inicia a rodada
    round.start();
    await this.roundRepository.update(round);
    this.gameGateway.broadcast('betting:end', { roundId: round.id });
  }

  // Gerencia a subida do multiplicador em tempo real
  private async handleRunningPhase() {
    const round = await this.roundRepository.findCurrent();
    if (!round || round.status !== RoundStatus.RUNNING) return;

    console.log(`Iniciando fase de EXECUÇÃO para rodada ${round.id} (Crash em: ${round.crashPoint}x)`);
    this.currentMultiplier = 1.0;

    return new Promise<void>((resolve) => {
      this.gameLoopInterval = setInterval(async () => {
        // Curva de crescimento
        const increment = 0.01 * Math.pow(this.currentMultiplier, 0.5);
        this.currentMultiplier += increment;

        const currentMult = Math.floor(this.currentMultiplier * 100) / 100;

        // Envia atualização do multiplicador via WebSocket
        this.gameGateway.broadcast('multiplier:tick', {
          roundId: round.id,
          multiplier: currentMult,
        });

        // Lógica de Auto-Cashout: verifica se algum jogador atingiu o alvo
        const bets = await this.betRepository.findByRoundId(round.id);
        for (const bet of bets) {
          if (bet.status === BetStatus.PENDING && bet.autoCashoutMultiplier && currentMult >= bet.autoCashoutMultiplier) {
            bet.cashOut(bet.autoCashoutMultiplier);
            await this.betRepository.update(bet);

            // Credita saldo na carteira via RabbitMQ
            this.walletClient.emit('wallet.credit', {
              playerId: bet.playerId,
              amount: bet.payout!.toString(),
              referenceId: bet.id,
              metadata: { roundId: round.id, multiplier: bet.autoCashoutMultiplier.toString(), type: 'auto' }
            });

            // Notifica o cashout automático para todos
            this.gameGateway.broadcast('bet:cashout', {
              betId: bet.id,
              roundId: round.id,
              playerId: bet.playerId,
              multiplier: bet.autoCashoutMultiplier,
              profit: Number(bet.payout! - bet.amount),
            });
          }
        }

        // Verifica se atingiu o ponto de crash
        if (this.currentMultiplier >= round.crashPoint) {
          clearInterval(this.gameLoopInterval!);
          resolve();
        }
      }, this.TICK_RATE);
    });
  }

  // Finaliza a rodada e liquida apostas perdidas
  private async handleCrashPhase() {
    const round = await this.roundRepository.findCurrent();
    if (!round) return;

    console.log(`CRASHOU em ${round.crashPoint}x`);
    round.crash();
    await this.roundRepository.update(round);

    // Revela a semente original para auditoria
    this.gameGateway.broadcast('round:crash', {
      roundId: round.id,
      crashPoint: round.crashPoint,
      seed: round.serverSeed,
    });

    // Marca todas as apostas restantes como perdidas
    const bets = await this.betRepository.findByRoundId(round.id);
    for (const bet of bets) {
      if (bet.status === BetStatus.PENDING) {
        bet.lose();
        await this.betRepository.update(bet);
      }
    }

    // Fecha a rodada definitivamente
    round.finish();
    await this.roundRepository.update(round);
  }

  getCurrentMultiplier(): number {
    return this.currentMultiplier;
  }
}
