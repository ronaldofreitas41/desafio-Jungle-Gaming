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

@Module({
  controllers: [GamesController],
  providers: [
    GetCurrentRoundUseCase,
    GetRoundHistoryUseCase,
    GetMyBetsUseCase,
    PlaceBetUseCase,
    CashOutUseCase,
    VerifyRoundUseCase,
    { provide: RoundRepository, useClass: PrismaRoundRepository },
    { provide: BetRepository, useClass: PrismaBetRepository },
  ],
  exports: [
    RoundRepository,
    BetRepository,
  ],
})
export class GameModule {}
