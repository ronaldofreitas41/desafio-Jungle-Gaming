import { Module } from "@nestjs/common";
import { GamesController } from "./presentation/controllers/games.controller";
import { GetCurrentRoundUseCase } from "./application/get-current-round.usecase";
import { GetRoundHistoryUseCase } from "./application/get-round-history.usecase";
import { GetMyBetsUseCase } from "./application/get-my-bets.usecase";
import { PlaceBetUseCase } from "./application/place-bet.usecase";
import { CashOutUseCase } from "./application/cash-out.usecase";
import { VerifyRoundUseCase } from "./application/verify-round.usecase";
import { RoundRepository, BetRepository } from "./domain/game.repository";
import { PrismaRoundRepository } from "./infrastructure/prisma-round.repository";
import { PrismaBetRepository } from "./infrastructure/prisma-bet.repository";
import { ProvablyFairService } from "./application/services/provably-fair.service";
import { GameEngineService } from "./application/services/game-engine.service";
import { GameGateway } from "./presentation/game.gateway";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'WALLET_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq:5672'],
          queue: 'wallet_queue',
          queueOptions: {
            durable: false
          },
        },
      },
    ]),
  ],
  controllers: [GamesController],
  providers: [
    GetCurrentRoundUseCase,
    GetRoundHistoryUseCase,
    GetMyBetsUseCase,
    PlaceBetUseCase,
    CashOutUseCase,
    VerifyRoundUseCase,
    ProvablyFairService,
    GameEngineService,
    GameGateway,
    { provide: RoundRepository, useClass: PrismaRoundRepository },
    { provide: BetRepository, useClass: PrismaBetRepository },
  ],
  exports: [
    RoundRepository,
    BetRepository,
  ],
})
export class GameModule {}
