import { create } from 'zustand'
import type { Round, Bet, RoundStatus, RoundHistory, AuthUser, Wallet } from '@/lib/types'

interface GameState {
  // Auth
  user: AuthUser | null
  isAuthenticated: boolean
  
  // Wallet
  wallet: Wallet | null
  
  // Current Round
  currentRound: Round | null
  status: RoundStatus
  multiplier: number
  bettingEndsAt: number | null
  
  // Player's current bet
  currentBet: Bet | null
  
  // Round history
  roundHistory: RoundHistory[]
  
  // Live bets in current round
  liveBets: Bet[]
  
  // Loading states
  isPlacingBet: boolean
  isCashingOut: boolean
  
  // Actions
  setUser: (user: AuthUser | null) => void
  setWallet: (wallet: Wallet | null) => void
  setCurrentRound: (round: Round | null) => void
  setStatus: (status: RoundStatus) => void
  setMultiplier: (multiplier: number) => void
  setBettingEndsAt: (timestamp: number | null) => void
  setCurrentBet: (bet: Bet | null) => void
  addToHistory: (history: RoundHistory) => void
  setRoundHistory: (history: RoundHistory[]) => void
  addLiveBet: (bet: Bet) => void
  updateLiveBet: (betId: string, updates: Partial<Bet>) => void
  clearLiveBets: () => void
  setIsPlacingBet: (value: boolean) => void
  setIsCashingOut: (value: boolean) => void
  updateBalance: (newBalance: bigint) => void
  logout: () => void
}

export const useGameStore = create<GameState>((set) => ({
  // ... (keeping other states as they are)
  user: null,
  isAuthenticated: false,
  wallet: null,
  currentRound: null,
  status: 'waiting',
  multiplier: 1.00,
  bettingEndsAt: null,
  currentBet: null,
  roundHistory: [],
  liveBets: [],
  isPlacingBet: false,
  isCashingOut: false,
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setWallet: (wallet) => set({ wallet }),
  
  setCurrentRound: (round) => set({ 
    currentRound: round, 
    status: round?.status || 'waiting',
    multiplier: round?.multiplier || 1.00
  }),
  
  setStatus: (status) => set({ status }),
  
  setMultiplier: (multiplier) => set({ multiplier }),
  
  setBettingEndsAt: (timestamp) => set({ bettingEndsAt: timestamp }),
  
  setCurrentBet: (bet) => set({ currentBet: bet }),
  
  addToHistory: (history) => set((state) => {
    if (state.roundHistory.some(r => r.id === history.id)) return state;
    return {
      roundHistory: [history, ...state.roundHistory].slice(0, 20)
    };
  }),
  
  setRoundHistory: (history) => set({ roundHistory: history }),
  
  addLiveBet: (bet) => set((state) => ({
    liveBets: [...state.liveBets, bet]
  })),
  
  updateLiveBet: (betId, updates) => set((state) => ({
    liveBets: state.liveBets.map((bet) => 
      bet.id === betId ? { ...bet, ...updates } : bet
    )
  })),
  
  clearLiveBets: () => set({ liveBets: [] }),
  
  setIsPlacingBet: (value) => set({ isPlacingBet: value }),
  
  setIsCashingOut: (value) => set({ isCashingOut: value }),
  
  updateBalance: (newBalance) => set((state) => ({
    wallet: state.wallet ? { ...state.wallet, balance: newBalance } : null
  })),
  
  logout: () => set({
    user: null,
    isAuthenticated: false,
    wallet: null,
    currentBet: null
  })
}))
