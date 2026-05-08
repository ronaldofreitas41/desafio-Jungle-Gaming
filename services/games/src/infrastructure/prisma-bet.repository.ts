import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { BetRepository } from "../domain/game.repository";
import { Bet, BetStatus } from "../domain/bet.entity";
import { Prisma } from "../../generated/client/client";

@Injectable()
export class PrismaBetRepository implements BetRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findById(id: string): Promise<Bet | null> {
    const bet = await this.prisma.bet.findUnique({ where: { id } });
    if (!bet) return null;
    return this.toEntity(bet);
  }

  async findByRoundId(roundId: string): Promise<Bet[]> {
    const bets = await this.prisma.bet.findMany({ where: { roundId } });
    return bets.map((b) => this.toEntity(b));
  }

  async findByPlayerId(playerId: string, page: number, limit: number): Promise<Bet[]> {
    const bets = await this.prisma.bet.findMany({
      where: { playerId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return bets.map((b) => this.toEntity(b));
  }

  async findByPlayerAndRound(playerId: string, roundId: string): Promise<Bet | null> {
    const bet = await this.prisma.bet.findUnique({
      where: {
        roundId_playerId: { roundId, playerId },
      },
    });
    if (!bet) return null;
    return this.toEntity(bet);
  }

  async create(bet: Bet): Promise<Bet> {
    const data: Prisma.BetCreateInput = {
      id: bet.id,
      round: { connect: { id: bet.roundId } },
      playerId: bet.playerId,
      username: bet.username,
      amount: bet.amount,
      status: bet.status as any,
      cashoutMultiplier: bet.cashoutMultiplier ? new Prisma.Decimal(bet.cashoutMultiplier) : null,
      payout: bet.payout,
      createdAt: bet.createdAt,
    };
    const created = await this.prisma.bet.create({ data });
    return this.toEntity(created);
  }

  async update(bet: Bet): Promise<Bet> {
    const data: Prisma.BetUpdateInput = {
      status: bet.status as any,
      cashoutMultiplier: bet.cashoutMultiplier ? new Prisma.Decimal(bet.cashoutMultiplier) : null,
      payout: bet.payout,
    };
    const updated = await this.prisma.bet.update({
      where: { id: bet.id },
      data,
    });
    return this.toEntity(updated);
  }

  private toEntity(model: any): Bet {
    return new Bet(
      model.id,
      model.roundId,
      model.playerId,
      model.username,
      model.amount,
      model.status as BetStatus,
      model.cashoutMultiplier?.toNumber(),
      model.payout,
      model.createdAt,
    );
  }
}
