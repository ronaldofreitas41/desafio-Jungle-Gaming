import { describe, it, expect } from "bun:test";
import { Wallet } from "../../src/domain/wallet.entity";

describe("Wallet Entity", () => {
  it("should credit balance", () => {
    const wallet = new Wallet("1", "user1", 1000n);
    wallet.credit(500n);
    expect(wallet.balance).toBe(1500n);
  });

  it("should debit balance", () => {
    const wallet = new Wallet("1", "user1", 1000n);
    wallet.debit(500n);
    expect(wallet.balance).toBe(500n);
  });

  it("should throw error when balance is insufficient", () => {
    const wallet = new Wallet("1", "user1", 1000n);
    expect(() => wallet.debit(1500n)).toThrow("Insufficient balance");
  });
});
