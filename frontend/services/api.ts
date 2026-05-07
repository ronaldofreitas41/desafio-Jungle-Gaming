import type { Round, Bet, RoundHistory, VerifyRoundResponse, BetHistoryResponse, Wallet } from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiService {
  private accessToken: string | null = null
  
  setAccessToken(token: string | null) {
    this.accessToken = token
  }
  
  private async fetch<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      throw new Error(error.message || `HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }
  
  // Wallet Service
  async createWallet(): Promise<Wallet> {
    return this.fetch<Wallet>('/wallets', { method: 'POST' })
  }
  
  async getWallet(): Promise<Wallet> {
    return this.fetch<Wallet>('/wallets/me')
  }
  
  // Game Service
  async getCurrentRound(): Promise<Round> {
    return this.fetch<Round>('/games/rounds/current')
  }
  
  async getRoundHistory(page = 1, limit = 20): Promise<RoundHistory[]> {
    return this.fetch<RoundHistory[]>(`/games/rounds/history?page=${page}&limit=${limit}`)
  }
  
  async verifyRound(roundId: string): Promise<VerifyRoundResponse> {
    return this.fetch<VerifyRoundResponse>(`/games/rounds/${roundId}/verify`)
  }
  
  async getMyBets(page = 1, limit = 20): Promise<BetHistoryResponse> {
    return this.fetch<BetHistoryResponse>(`/games/bets/me?page=${page}&limit=${limit}`)
  }
  
  async placeBet(amount: number): Promise<Bet> {
    return this.fetch<Bet>('/games/bet', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  }
  
  async cashOut(): Promise<Bet> {
    return this.fetch<Bet>('/games/bet/cashout', {
      method: 'POST',
    })
  }
}

export const apiService = new ApiService()
