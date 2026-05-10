import { describe, it, expect } from "bun:test";
import { ProvablyFairService } from "../../src/application/services/provably-fair.service";

describe("ProvablyFairService", () => {
  const service = new ProvablyFairService();

  it("should generate a random server seed", () => {
    const seed1 = service.generateServerSeed();
    const seed2 = service.generateServerSeed();
    expect(seed1).not.toBe(seed2);
    expect(seed1.length).toBe(64); // 32 bytes hex
  });

  it("should calculate crash point deterministically", () => {
    const serverSeed = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const clientSeed = "test";
    const nonce = 1;
    
    const crashPoint1 = service.calculateCrashPoint(serverSeed, clientSeed, nonce);
    const crashPoint2 = service.calculateCrashPoint(serverSeed, clientSeed, nonce);
    
    expect(crashPoint1).toBe(crashPoint2);
    expect(crashPoint1).toBeGreaterThanOrEqual(1.0);
  });

  it("should produce a hash of the server seed", () => {
    const serverSeed = "abc";
    const hash = service.hashServerSeed(serverSeed);
    expect(hash).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"); // SHA256 of "abc"
  });
});
