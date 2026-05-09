import { Injectable } from '@nestjs/common';
import { createHash, createHmac, randomBytes } from 'crypto';

@Injectable()
export class ProvablyFairService {
  // Gera uma semente aleatória segura de 32 bytes
  generateServerSeed(): string {
    return randomBytes(32).toString('hex');
  }

  // Gera o hash público para auditoria pré-rodada
  hashServerSeed(serverSeed: string): string {
    return createHash('sha256').update(serverSeed).digest('hex');
  }

  // Calcula o multiplicador de crash (Provably Fair)
  calculateCrashPoint(serverSeed: string, clientSeed: string, nonce: number): number {
    const combined = `${clientSeed}:${nonce}`;
    const hmac = createHmac('sha256', serverSeed);
    hmac.update(combined);
    const hash = hmac.digest('hex');

    // Usa os primeiros 13 caracteres do hash (52 bits)
    const h = parseInt(hash.substring(0, 13), 16);
    const e = Math.pow(2, 52);

    // Fórmula matemática do ponto de crash
    let crashPoint = Math.floor((100 * e - h) / (e - h)) / 100;

    // Garante multiplicador mínimo de 1.00x
    return Math.max(1.0, crashPoint);
  }
}
