import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { RoundRepository } from "../domain/game.repository";
import { Round, RoundStatus } from "../domain/round.entity";
import { Prisma } from "../../generated/client/client";

@Injectable()
export class PrismaRoundRepository implements RoundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Round | null> {
    const round = await this.prisma.round.findUnique({ where: { id } });
    if (!round) return null;
    return this.toEntity(round);
  }

  async findCurrent(): Promise<Round | null> {
    // Busca a rodada mais recente que não esteja CRASHED ou FINISHED
    const round = await this.prisma.round.findFirst({
      where: {
        status: { in: [RoundStatus.BETTING, RoundStatus.RUNNING] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!round) return null;
    return this.toEntity(round);
  }

  async findHistory(page: number, limit: number): Promise<Round[]> {
    const rounds = await this.prisma.round.findMany({
      where: { status: { in: [RoundStatus.CRASHED, RoundStatus.FINISHED] } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return rounds.map((r) => this.toEntity(r));
  }

  async create(round: Round): Promise<Round> {
    const data: Prisma.RoundCreateInput = {
      id: round.id,
      status: round.status as any,
      crashPoint: new Prisma.Decimal(round.crashPoint),
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      startedAt: round.startedAt,
      crashedAt: round.crashedAt,
      createdAt: round.createdAt,
    };
    const created = await this.prisma.round.create({ data });
    return this.toEntity(created);
  }

  async update(round: Round): Promise<Round> {
    const data: Prisma.RoundUpdateInput = {
      status: round.status as any,
      crashPoint: new Prisma.Decimal(round.crashPoint),
      startedAt: round.startedAt,
      crashedAt: round.crashedAt,
    };
    const updated = await this.prisma.round.update({
      where: { id: round.id },
      data,
    });
    return this.toEntity(updated);
  }

  private toEntity(model: any): Round {
    return new Round(
      model.id,
      model.status as RoundStatus,
      model.crashPoint.toNumber(),
      model.serverSeed,
      model.serverSeedHash,
      model.startedAt,
      model.crashedAt,
      model.createdAt,
    );
  }
}
