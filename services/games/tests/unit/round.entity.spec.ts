import { describe, it, expect } from "bun:test";
import { Round, RoundStatus } from "../../src/domain/round.entity";

describe("Round Entity", () => {
  it("should start a round from BETTING status", () => {
    const round = new Round("1", RoundStatus.BETTING, 2.5, "seed", "hash");
    round.start();
    expect(round.status).toBe(RoundStatus.RUNNING);
    expect(round.startedAt).toBeInstanceOf(Date);
  });

  it("should throw error when starting a round not in BETTING status", () => {
    const round = new Round("1", RoundStatus.RUNNING, 2.5, "seed", "hash");
    expect(() => round.start()).toThrow("A rodada só pode começar a partir do status de APOSTAS");
  });

  it("should crash a round from RUNNING status", () => {
    const round = new Round("1", RoundStatus.RUNNING, 2.5, "seed", "hash");
    round.crash();
    expect(round.status).toBe(RoundStatus.CRASHED);
    expect(round.crashedAt).toBeInstanceOf(Date);
  });

  it("should detect if it has crashed", () => {
    const round = new Round("1", RoundStatus.RUNNING, 2.5, "seed", "hash");
    expect(round.hasCrashed(2.49)).toBe(false);
    expect(round.hasCrashed(2.5)).toBe(true);
    expect(round.hasCrashed(2.51)).toBe(true);
  });
});
