'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useGameStore } from '@/stores/game-store'
import { wsService } from '@/services/websocket'
import { authService } from '@/services/auth'
import type { Bet, RoundHistory } from '@/lib/types'

export function useWebSocket() {
  const {
    user,
    setStatus,
    setMultiplier,
    setBettingEndsAt,
    setCurrentBet,
    addToHistory,
    addLiveBet,
    updateLiveBet,
    clearLiveBets,
    setCurrentRound,
  } = useGameStore()
  
  const connectedRef = useRef(false)
  
  useEffect(() => {
    if (connectedRef.current) return
    
    const token = user?.accessToken
    wsService.connect(token)
    connectedRef.current = true
    
    // Round start - betting phase
    const unsubRoundStart = wsService.on('round:start', (data: unknown) => {
      const payload = data as { roundId: string; hash: string; bettingEndsAt: string }
      setStatus('betting')
      setMultiplier(1.00)
      clearLiveBets()
      setCurrentBet(null)
      setBettingEndsAt(new Date(payload.bettingEndsAt).getTime())
      setCurrentRound({
        id: payload.roundId,
        status: 'betting',
        multiplier: 1.00,
        hash: payload.hash,
        bets: []
      })
    })
    
    // Betting phase ends
    const unsubBettingEnd = wsService.on('betting:end', () => {
      setStatus('running')
      setBettingEndsAt(null)
    })
    
    // Multiplier updates
    const unsubMultiplier = wsService.on('multiplier:tick', (data: unknown) => {
      const payload = data as { multiplier: number }
      setMultiplier(payload.multiplier)
    })
    
    // Round crashed
    const unsubCrash = wsService.on('round:crash', (data: unknown) => {
      const payload = data as { roundId: string; crashPoint: number; seed: string }
      setStatus('crashed')
      setMultiplier(payload.crashPoint)
      
      // Add to history
      const historyItem: RoundHistory = {
        id: payload.roundId,
        crashPoint: payload.crashPoint,
        hash: '',
        createdAt: new Date().toISOString()
      }
      addToHistory(historyItem)
      
      // Mark current bet as lost if not cashed out
      const currentBet = useGameStore.getState().currentBet
      if (currentBet && currentBet.status === 'pending') {
        setCurrentBet({ ...currentBet, status: 'lost' })
      }
    })
    
    // New bet placed
    const unsubBetPlaced = wsService.on('bet:placed', (data: unknown) => {
      const bet = data as Bet
      addLiveBet(bet)
      
      // If it's our bet
      if (user && bet.playerId === user.id) {
        setCurrentBet(bet)
      }
    })
    
    // Someone cashed out
    const unsubCashOut = wsService.on('bet:cashout', (data: unknown) => {
      const payload = data as { 
        betId: string; 
        playerId: string; 
        multiplier: number; 
        profit: number 
      }
      
      updateLiveBet(payload.betId, {
        cashedOutAt: payload.multiplier,
        profit: payload.profit,
        status: 'won'
      })
      
      // If it's our cash out
      if (user && payload.playerId === user.id) {
        const currentBet = useGameStore.getState().currentBet
        if (currentBet) {
          setCurrentBet({
            ...currentBet,
            cashedOutAt: payload.multiplier,
            profit: payload.profit,
            status: 'won'
          })
        }
      }
    })
    
    return () => {
      unsubRoundStart()
      unsubBettingEnd()
      unsubMultiplier()
      unsubCrash()
      unsubBetPlaced()
      unsubCashOut()
    }
  }, [user?.accessToken])
  
  return {
    isConnected: wsService.isConnected()
  }
}

export function useAuth() {
  const { user, setUser, setWallet, logout: storeLogout } = useGameStore()
  
  // Check for stored user on mount
  useEffect(() => {
    const storedUser = authService.getStoredUser()
    if (storedUser && !authService.isTokenExpired(storedUser.accessToken)) {
      setUser(storedUser)
    }
  }, [setUser])
  
  const login = useCallback(() => {
    authService.login()
  }, [])
  
  const logout = useCallback(async () => {
    storeLogout()
    await authService.logout()
  }, [storeLogout])
  
  const handleCallback = useCallback(async (code: string, state: string) => {
    const authUser = await authService.handleCallback(code, state)
    setUser(authUser)
    return authUser
  }, [setUser])
  
  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    handleCallback
  }
}
