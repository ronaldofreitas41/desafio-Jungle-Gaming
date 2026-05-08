export class BetsMeResponseDto {
  id: string;
  roundId: string;
  amount: number;
  status: string;
  cashoutMultiplier?: number;
  payout: number;
  createdAt: Date;
}
