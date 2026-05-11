// Game Types
export type RoundStatus = 'betting' | 'running' | 'crashed' | 'waiting'

export interface Round {
  id: string
  status: RoundStatus
  crashPoint?: number
  multiplier: number
  startedAt?: string
  endedAt?: string
  bettingEndsAt?: string
  hash: string
  seed?: string
  bets: Bet[]
}

export interface Bet {
  id: string
  roundId: string
  playerId: string
  playerName: string
  amount: bigint // in cents
  cashedOutAt?: number // multiplier when cashed out
  profit?: bigint // in cents
  status: 'pending' | 'won' | 'lost'
  createdAt: string
}

export interface Player {
  id: string
  username: string
  avatar?: string
}

export interface Wallet {
  id: string
  playerId: string
  balance: bigint // in cents
}

// WebSocket Events (Server to Client)
export interface WSRoundStartEvent {
  type: 'round:start'
  payload: {
    roundId: string
    hash: string
    bettingEndsAt: string
  }
}

export interface WSBettingEndEvent {
  type: 'betting:end'
  payload: {
    roundId: string
  }
}

export interface WSMultiplierTickEvent {
  type: 'multiplier:tick'
  payload: {
    roundId: string
    multiplier: number
    elapsed: number
  }
}

export interface WSCrashEvent {
  type: 'round:crash'
  payload: {
    roundId: string
    crashPoint: number
    seed: string
  }
}

export interface WSBetPlacedEvent {
  type: 'bet:placed'
  payload: Bet
}

export interface WSCashOutEvent {
  type: 'bet:cashout'
  payload: {
    betId: string
    playerId: string
    playerName: string
    multiplier: number
    profit: bigint
  }
}

export type WSEvent = 
  | WSRoundStartEvent 
  | WSBettingEndEvent 
  | WSMultiplierTickEvent 
  | WSCrashEvent 
  | WSBetPlacedEvent 
  | WSCashOutEvent

// API Response Types
export interface RoundHistory {
  id: string
  crashPoint: number
  hash: string
  createdAt: string
}

export interface VerifyRoundResponse {
  roundId: string
  crashPoint: number
  hash: string
  seed: string
  serverSeed: string
  nonce: number
}

export interface BetHistoryResponse {
  bets: Bet[]
  total: number
  page: number
  limit: number
}

// Auth Types
export interface AuthUser {
  id: string
  username: string
  email?: string
  accessToken: string
  refreshToken?: string
}

// Keycloak Token
export interface KeycloakToken {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}
