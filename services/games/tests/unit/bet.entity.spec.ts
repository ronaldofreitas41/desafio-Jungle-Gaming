import { describe, it, expect } from "bun:test";
import { Bet, BetStatus } from "../../src/domain/bet.entity";

describe("Bet Entity", () => {
  it("should cash out correctly", () => {
    const bet = new Bet("1", "round1", "player1", "user1", 1000n); // 10.00
    bet.cashOut(2.5);
    expect(bet.status).toBe(BetStatus.CASHED_OUT);
    expect(bet.cashoutMultiplier).toBe(2.5);
    expect(bet.payout).toBe(2500n); // 10.00 * 2.5 = 25.00
  });

  it("should throw error when cashing out non-pending bet", () => {
    const bet = new Bet("1", "round1", "player1", "user1", 1000n);
    bet.lose();
    expect(() => bet.cashOut(2.5)).toThrow("Apenas apostas pendentes podem ser sacadas");
  });

  it("should mark as lost", () => {
    const bet = new Bet("1", "round1", "player1", "user1", 1000n);
    bet.lose();
    expect(bet.status).toBe(BetStatus.LOST);
    expect(bet.payout).toBe(0n);
  });
});
