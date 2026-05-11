import { Controller, Get, Param, Post, Req, UseGuards, Body, Query } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/response/health-check-response.dto";
import { JwtAuthGuard } from "@/infrastructure/auth/jwt.guard";
import { GetCurrentRoundUseCase } from "@/application/get-current-round.usecase";
import { GetRoundHistoryUseCase } from "@/application/get-round-history.usecase";
import { GetMyBetsUseCase } from "@/application/get-my-bets.usecase";
import { PlaceBetUseCase } from "@/application/place-bet.usecase";
import { CashOutUseCase } from "@/application/cash-out.usecase";
import { VerifyRoundUseCase } from "@/application/verify-round.usecase";
import { PlaceBetRequestDto } from "../dtos/request/place-bet-request.dto";
import { CashOutRequestDto } from "../dtos/request/cash-out-request.dto";
import { CurrentRoundResponseDto } from "../dtos/response/rounds-current-response.dto";
import { RoundsHistoryResponseDto } from "../dtos/response/rounds-history-response.dto";
import { BetsMeResponseDto } from "../dtos/response/bets-me-response.dto";
import { RoundsVerifyResponseDto } from "../dtos/response/rounds-verify-response.dto";
import { GameEngineService } from "@/application/services/game-engine.service";
import { RoundStatus } from "@/domain/round.entity";

// O GamesController gerencia todas as requisições HTTP relacionadas ao jogo.
@Controller("games")
export class GamesController {
  constructor(
    private readonly getCurrentRoundUseCase: GetCurrentRoundUseCase,
    private readonly getRoundHistoryUseCase: GetRoundHistoryUseCase,
    private readonly getMyBetsUseCase: GetMyBetsUseCase,
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashOutUseCase: CashOutUseCase,
    private readonly verifyRoundUseCase: VerifyRoundUseCase,
    private readonly gameEngineService: GameEngineService,
  ) {}

  // Rota para verificar se a API está rodando
  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  // GET /games/rounds/current - Estado da rodada atual com apostas
  @Get("rounds/current")
  async getCurrentRound(): Promise<CurrentRoundResponseDto | null> {
    const output = await this.getCurrentRoundUseCase.execute();
    if (!output) return null;

    return {
      id: output.round.id,
      status: output.round.status.toLowerCase() as any,
      currentMultiplier: this.gameEngineService.getCurrentMultiplier(),
      startedAt: output.round.startedAt,
      bettingEndsAt: output.round.status === RoundStatus.BETTING 
        ? new Date(output.round.createdAt.getTime() + 10000) 
        : undefined,
      bets: output.bets.map((b) => ({
        playerId: b.playerId,
        username: b.username,
        amount: Number(b.amount), // Mantém em centavos
        status: b.status === 'CASHED_OUT' ? 'won' : b.status.toLowerCase() as any,
        cashoutMultiplier: b.cashoutMultiplier,
      })),
    };
  }

  // GET /games/rounds/history - Histórico paginado de rodadas
  @Get("rounds/history")
  async getHistoryRounds(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 20,
  ): Promise<RoundsHistoryResponseDto[]> {
    const rounds = await this.getRoundHistoryUseCase.execute(page, limit);
    return rounds.map((r): RoundsHistoryResponseDto => ({
      id: r.id,
      status: r.status.toLowerCase() as any,
      crashPoint: r.crashPoint,
      createdAt: r.createdAt,
    }));
  }

  // GET /games/rounds/:roundId/verify - Dados de verificação provably fair
  @Get("rounds/:roundId/verify")
  async verifyRound(@Param("roundId") roundId: string): Promise<RoundsVerifyResponseDto> {
    return this.verifyRoundUseCase.execute(roundId);
  }

  // GET /games/bets/me - Histórico de apostas do jogador
  @Get("bets/me")
  @UseGuards(JwtAuthGuard)
  async getMyBets(
    @Req() req: any,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ): Promise<BetsMeResponseDto[]> {
    const bets = await this.getMyBetsUseCase.execute(req.user.id, page, limit);
    return bets.map((b): BetsMeResponseDto => ({
      id: b.id,
      roundId: b.roundId,
      amount: Number(b.amount), // Mantém em centavos
      status: b.status === 'CASHED_OUT' ? 'won' : b.status.toLowerCase() as any,
      cashoutMultiplier: b.cashoutMultiplier,
      payout: b.payout ? Number(b.payout) : 0, // Mantém em centavos
      createdAt: b.createdAt,
    }));
  }

  // POST /games/bet - Faz uma aposta na rodada atual
  @Post("bet")
  @UseGuards(JwtAuthGuard)
  async bet(@Req() req: any, @Body() dto: PlaceBetRequestDto) {
    // O cliente envia o valor já em centavos (inteiro), alinhado à carteira e ao place-bet.usecase
    const amountBigInt = BigInt(Math.trunc(dto.amount));
    
    // req.user contém os dados do JWT (sub é o id do usuário no Keycloak)
    const bet = await this.placeBetUseCase.execute(
        req.user.id, 
        req.user.username || "Player", 
        amountBigInt
    );

    return {
      id: bet.id,
      amount: Number(bet.amount), // Mantém em centavos
      status: bet.status.toLowerCase() as any,
    };
  }

  // POST /games/bet/cashout - Sacar na rodada atual
  @Post("bet/cashout")
  @UseGuards(JwtAuthGuard)
  async cashout(@Req() req: any, @Body() dto: CashOutRequestDto) {
    const bet = await this.cashOutUseCase.execute(req.user.id, dto.multiplier);

    return {
      id: bet.id,
      status: 'won',
      cashoutMultiplier: bet.cashoutMultiplier,
      payout: Number(bet.payout), // Mantém em centavos
    };
  }
}
