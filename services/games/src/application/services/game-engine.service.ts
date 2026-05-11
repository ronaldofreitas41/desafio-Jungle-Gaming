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
  private currentMultiplier = 1.0;           // Multiplicador atual da rodada
  private gameLoopInterval: NodeJS.Timer | null = null; // Intervalo do loop de execução
  private readonly TICK_RATE = 100;           // Taxa de atualização em ms (100ms = 10 ticks/s)
  private readonly BETTING_DURATION = 10000;  // Duração da fase de apostas (10s)
  private isEngineRunning = false;            // Flag para evitar múltiplos loops simultâneos

  constructor(
    private readonly roundRepository: RoundRepository,
    private readonly betRepository: BetRepository,
    private readonly provablyFairService: ProvablyFairService,
    private readonly gameGateway: GameGateway,
    @Inject('WALLET_SERVICE') private readonly walletClient: ClientProxy,
  ) { }

  // Iniciado automaticamente pelo NestJS quando o módulo carrega
  async onModuleInit() {
    if (this.isEngineRunning) return;
    this.isEngineRunning = true;
    this.runEngine();
  }

  // Loop infinito que gerencia as 3 fases do jogo em sequência
  private async runEngine() {
    while (true) {
      await this.handleBettingPhase();
      await this.handleRunningPhase();
      await this.handleCrashPhase();
      // Pausa de 3s entre rodadas para o frontend mostrar o resultado
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  // Cria uma nova rodada ou retoma uma existente após restart do serviço
  private async handleBettingPhase() {
    let round = await this.roundRepository.findCurrent();

    if (round) {
      console.log(`Rodada ${round.id} já está ativa (${round.status}).`);

      if (round.status === RoundStatus.RUNNING) {
        // Rodada já estava a correr antes do restart — handleRunningPhase vai tratar
        return;
      }

      if (round.status === RoundStatus.CRASHED) {
        // Rodada já crashou antes do restart — handleCrashPhase vai finalizar
        return;
      }

      // Status BETTING — calcula o tempo RESTANTE para não reiniciar o contador
      const bettingEndsAt = new Date(round.createdAt.getTime() + this.BETTING_DURATION);
      const remaining = bettingEndsAt.getTime() - Date.now();

      // Notifica clientes que se conectaram após o início da fase de apostas
      this.gameGateway.broadcast('round:start', {
        roundId: round.id,
        hash: round.serverSeedHash,
        bettingEndsAt: bettingEndsAt.toISOString(),
      });

      // Aguarda apenas o tempo restante (não os 10s completos)
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      // Transita para RUNNING e notifica fim das apostas
      round.start();
      await this.roundRepository.update(round);
      this.gameGateway.broadcast('betting:end', { roundId: round.id });
      return;
    }

    // Nenhuma rodada ativa — cria uma nova
    console.log('Iniciando fase de APOSTAS');

    // Gera os dados criptográficos para o Provably Fair
    const serverSeed = this.provablyFairService.generateServerSeed();
    const serverSeedHash = this.provablyFairService.hashServerSeed(serverSeed);
    const clientSeed = 'default_client_seed';
    const nonce = Math.floor(Date.now() / 1000);

    // O crash point é calculado ANTES das apostas — garantia do Provably Fair
    const crashPoint = this.provablyFairService.calculateCrashPoint(serverSeed, clientSeed, nonce);

    round = new Round(
      randomUUID(),
      RoundStatus.BETTING,
      crashPoint,
      serverSeed,
      serverSeedHash,
    );

    await this.roundRepository.create(round);

    const bettingEndsAt = new Date(Date.now() + this.BETTING_DURATION).toISOString();

    // Notifica todos os clientes — hash é revelada agora, seed só após o crash
    this.gameGateway.broadcast('round:start', {
      roundId: round.id,
      hash: serverSeedHash,
      bettingEndsAt,
    });

    // Aguarda os 10 segundos de apostas
    await new Promise((resolve) => setTimeout(resolve, this.BETTING_DURATION));

    // Transita para RUNNING
    round.start();
    await this.roundRepository.update(round);
    this.gameGateway.broadcast('betting:end', { roundId: round.id });
  }

  // Sobe o multiplicador até atingir o crash point
  private async handleRunningPhase() {
    const round = await this.roundRepository.findCurrent();
    if (!round || round.status !== RoundStatus.RUNNING) return;

    console.log(`Iniciando fase de EXECUÇÃO para rodada ${round.id} (Crash em: ${round.crashPoint}x)`);
    this.currentMultiplier = 1.0;

    return new Promise<void>((resolve) => {
      this.gameLoopInterval = setInterval(async () => {
        // Curva de crescimento exponencial — começa devagar e acelera
        const increment = 0.01 * Math.pow(this.currentMultiplier, 0.5);
        this.currentMultiplier += increment;

        // Arredonda para 2 casas decimais para o frontend
        const currentMult = Math.floor(this.currentMultiplier * 100) / 100;

        // Emite o multiplicador atual para todos os clientes via WebSocket
        this.gameGateway.broadcast('multiplier:tick', {
          roundId: round.id,
          multiplier: currentMult,
        });

        // Verifica se algum jogador atingiu o seu multiplicador alvo
        const bets = await this.betRepository.findByRoundId(round.id);
        for (const bet of bets) {
          if (
            bet.status === BetStatus.PENDING &&
            bet.autoCashoutMultiplier &&
            currentMult >= bet.autoCashoutMultiplier
          ) {
            // Processa o cashout automático na entidade
            bet.cashOut(bet.autoCashoutMultiplier);
            await this.betRepository.update(bet);

            // Credita o ganho na carteira via RabbitMQ (assíncrono)
            this.walletClient.emit('wallet.credit', {
              playerId: bet.playerId,
              amount: bet.payout!.toString(),
              referenceId: bet.id,
              metadata: {
                roundId: round.id,
                multiplier: bet.autoCashoutMultiplier.toString(),
                type: 'auto',
              },
            });

            // Notifica todos os clientes do cashout automático
            this.gameGateway.broadcast('bet:cashout', {
              betId: bet.id,
              roundId: round.id,
              playerId: bet.playerId,
              status: 'won',
              multiplier: bet.autoCashoutMultiplier,
              profit: Number(bet.payout! - bet.amount),
            });
          }
        }

        if (this.currentMultiplier >= round.crashPoint) {
          clearInterval(this.gameLoopInterval!);
          this.gameLoopInterval = null;
          resolve();
        }
      }, this.TICK_RATE);
    });
  }

  // Finaliza a rodada, liquida apostas perdidas e revela a seed
  private async handleCrashPhase() {
    const round = await this.roundRepository.findCurrent();
    if (!round) return;

    // Transita para CRASHED se ainda estava RUNNING
    if (round.status === RoundStatus.RUNNING) {
      console.log(`CRASHOU em ${round.crashPoint}x`);
      round.crash();
      await this.roundRepository.update(round);
    }

    if (round.status === RoundStatus.CRASHED) {
      // Revela a seed original — jogadores podem agora verificar o Provably Fair
      this.gameGateway.broadcast('round:crash', {
        roundId: round.id,
        crashPoint: round.crashPoint,
        seed: round.serverSeed, // seed revelada após o crash
      });

      // Marca todas as apostas pendentes como perdidas e notifica
      const bets = await this.betRepository.findByRoundId(round.id);
      for (const bet of bets) {
        if (bet.status === BetStatus.PENDING) {
          bet.lose();
          await this.betRepository.update(bet);
        }
      }

      // Fecha a rodada definitivamente — não aparece mais no findCurrent()
      round.finish();
      await this.roundRepository.update(round);
    }
  }

  // Exposto para o controller GET /games/rounds/current
  getCurrentMultiplier(): number {
    return this.currentMultiplier;
  }
}