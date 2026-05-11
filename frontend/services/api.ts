import type { Round, Bet, RoundHistory, VerifyRoundResponse, BetHistoryResponse, Wallet } from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Serviço central para chamadas de API (HTTP) para os microserviços de Wallet e Games
class ApiService {
  private accessToken: string | null = null
  
  // Define o token JWT para as requisições autenticadas
  setAccessToken(token: string | null) {
    this.accessToken = token
  }
  
  // Wrapper genérico para o fetch com tratamento de erros e headers
  private async fetch<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const headers = new Headers(options.headers)
    headers.set('Content-Type', 'application/json')
    
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`)
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
      throw new Error(error.message || `Erro HTTP! status: ${response.status}`)
    }
    
    return response.json()
  }
  
  // --- Serviço de Carteira (Wallets) ---

  // Cria uma carteira para o usuário autenticado
  async createWallet(): Promise<Wallet> {
    return this.fetch<Wallet>('/wallets', { method: 'POST' })
  }
  
  // Busca a carteira do usuário atual
  async getWallet(): Promise<Wallet> {
    return this.fetch<Wallet>('/wallets/me')
  }

  // Adiciona saldo à carteira do usuário autenticado
  async deposit(amount: number): Promise<Wallet> {
    return this.fetch<Wallet>('/wallets/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
  }
  
  // --- Serviço de Jogo (Games) ---

  // Busca a rodada atual e o estado do multiplicador
  async getCurrentRound(): Promise<Round> {
    const data = await this.fetch<any>('/games/rounds/current')
    return {
      ...data,
      status: data.status.toLowerCase(),
      multiplier: data.currentMultiplier || 1.0
    }
  }
  
  // Busca o histórico global de rodadas (pontos de crash passados)
  async getRoundHistory(page = 1, limit = 20): Promise<RoundHistory[]> {
    return this.fetch<RoundHistory[]>(`/games/rounds/history?page=${page}&limit=${limit}`)
  }
  
  // Solicita a verificação de integridade de uma rodada específica (Provably Fair)
  async verifyRound(roundId: string): Promise<VerifyRoundResponse> {
    return this.fetch<VerifyRoundResponse>(`/games/rounds/${roundId}/verify`)
  }
  
  // Busca o histórico de apostas do usuário logado
  async getMyBets(page = 1, limit = 20): Promise<BetHistoryResponse> {
    return this.fetch<BetHistoryResponse>(`/games/bets/me?page=${page}&limit=${limit}`)
  }
  
  // Envia uma nova aposta para a rodada atual
  async placeBet(amount: bigint): Promise<Bet> {
    return this.fetch<Bet>('/games/bet', {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount) }),
    })
  }
  
  // Realiza o saque (cash out) da aposta ativa
  async cashOut(): Promise<Bet> {
    return this.fetch<Bet>('/games/bet/cashout', {
      method: 'POST',
    })
  }
}

export const apiService = new ApiService()
