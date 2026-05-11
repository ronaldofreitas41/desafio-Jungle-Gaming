export class CurrentRoundResponseDto {
    id: string;
    status: string;
    currentMultiplier: number;
    startedAt?: Date;
    bettingEndsAt?: Date;
    bets: {
        playerId: string;
        username: string;
        amount: number;
        cashoutMultiplier?: number;
        status: string;
    }[];
}