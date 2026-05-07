'use client'

import { useEffect, useState } from 'react'
import { CrashGraph } from '@/components/game/crash-graph'
import { BettingControls } from '@/components/game/betting-controls'
import { LiveBets } from '@/components/game/live-bets'
import { RoundHistory } from '@/components/game/round-history'
import { GameStats } from '@/components/game/game-stats'
import { LoginPrompt } from '@/components/game/login-prompt'
import { Header, Footer } from '@/components/game/layout'
import { useWebSocket, useAuth } from '@/hooks/use-game'
import { useGameStore } from '@/stores/game-store'
import { apiService } from '@/services/api'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Bet, RoundHistory as RoundHistoryType } from '@/lib/types'

export default function GamePage() {
  const [isLoading, setIsLoading] = useState(true)
  const { user, isAuthenticated } = useGameStore()
  const { 
    setWallet, 
    setRoundHistory, 
    addLiveBet, 
    setCurrentRound, 
    setStatus, 
    setMultiplier,
    setBettingEndsAt,
    clearLiveBets,
    setCurrentBet,
    addToHistory,
    updateLiveBet
  } = useGameStore()
  
  // Connect to WebSocket
  useWebSocket()
  useAuth()
  
  // Set API token when user changes
  useEffect(() => {
    if (user?.accessToken) {
      apiService.setAccessToken(user.accessToken)
    }
  }, [user?.accessToken])
  
  // Fetch initial data
  useEffect(() => {
    async function fetchInitialData() {
      try {
        // Fetch current round
        try {
          const currentRound = await apiService.getCurrentRound()
          setCurrentRound(currentRound)
          currentRound.bets?.forEach((bet: Bet) => addLiveBet(bet))
        } catch {
          // No active round, start in waiting state
          setStatus('waiting')
          setMultiplier(1.00)
        }
        
        // Fetch round history
        try {
          const history = await apiService.getRoundHistory()
          setRoundHistory(history)
        } catch {
          // Use mock data if API fails
          setRoundHistory(generateMockHistory())
        }
        
        // Fetch wallet if authenticated
        if (user?.accessToken) {
          try {
            const wallet = await apiService.getWallet()
            setWallet(wallet)
          } catch {
            // Create wallet if doesn't exist
            try {
              const newWallet = await apiService.createWallet()
              setWallet(newWallet)
            } catch {
              // Mock wallet for demo
              setWallet({ id: '1', playerId: user.id, balance: 100000 }) // R$ 1000,00
            }
          }
        }
      } catch (error) {
        console.error('[v0] Error fetching initial data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchInitialData()
  }, [user?.accessToken, setWallet, setRoundHistory, addLiveBet, setCurrentRound, setStatus, setMultiplier])
  
  // Demo mode simulation (when backend API is not connected)
  useEffect(() => {
    if (isLoading) return
    
    let timeoutId: ReturnType<typeof setTimeout>
    let intervalId: ReturnType<typeof setInterval>
    
    const runDemoRound = () => {
      const store = useGameStore.getState()
      
      // Start betting phase
      store.setStatus('betting')
      store.setBettingEndsAt(Date.now() + 10000) // 10 seconds
      store.setMultiplier(1.00)
      store.clearLiveBets()
      store.setCurrentBet(null)
      store.setCurrentRound({
        id: `demo-${Date.now()}`,
        status: 'betting',
        multiplier: 1.00,
        hash: generateRandomHash(),
        bets: []
      })
      
      // Add mock bets during betting phase
      setTimeout(() => {
        const mockBets: Bet[] = [
          { id: `bet-${Date.now()}-1`, roundId: 'demo', playerId: 'bot1', playerName: 'CryptoKing', amount: 5000, status: 'pending', createdAt: new Date().toISOString() },
          { id: `bet-${Date.now()}-2`, roundId: 'demo', playerId: 'bot2', playerName: 'LuckyPlayer', amount: 2500, status: 'pending', createdAt: new Date().toISOString() },
          { id: `bet-${Date.now()}-3`, roundId: 'demo', playerId: 'bot3', playerName: 'HighRoller', amount: 10000, status: 'pending', createdAt: new Date().toISOString() },
          { id: `bet-${Date.now()}-4`, roundId: 'demo', playerId: 'bot4', playerName: 'Whale99', amount: 25000, status: 'pending', createdAt: new Date().toISOString() },
        ]
        mockBets.forEach(bet => store.addLiveBet(bet))
      }, 2000)
      
      // Add more bets
      setTimeout(() => {
        const moreBets: Bet[] = [
          { id: `bet-${Date.now()}-5`, roundId: 'demo', playerId: 'bot5', playerName: 'NovoBet', amount: 1500, status: 'pending', createdAt: new Date().toISOString() },
          { id: `bet-${Date.now()}-6`, roundId: 'demo', playerId: 'bot6', playerName: 'ApostaFacil', amount: 3000, status: 'pending', createdAt: new Date().toISOString() },
        ]
        moreBets.forEach(bet => store.addLiveBet(bet))
      }, 5000)
      
      // End betting phase, start running
      setTimeout(() => {
        store.setStatus('running')
        store.setBettingEndsAt(null)
        
        // Determine crash point (weighted towards lower values)
        const random = Math.random()
        let crashPoint: number
        if (random < 0.33) {
          crashPoint = 1 + Math.random() * 0.5 // 1.00 - 1.50 (33%)
        } else if (random < 0.66) {
          crashPoint = 1.5 + Math.random() * 1.5 // 1.50 - 3.00 (33%)
        } else if (random < 0.9) {
          crashPoint = 3 + Math.random() * 4 // 3.00 - 7.00 (24%)
        } else {
          crashPoint = 7 + Math.random() * 15 // 7.00 - 22.00 (10%)
        }
        crashPoint = Number(crashPoint.toFixed(2))
        
        let currentMult = 1.00
        const startTime = Date.now()
        
        // Multiplier animation
        intervalId = setInterval(() => {
          const elapsed = Date.now() - startTime
          // Exponential growth curve
          currentMult = Math.pow(Math.E, elapsed / 8000) // Adjust speed
          currentMult = Number(currentMult.toFixed(2))
          
          store.setMultiplier(currentMult)
          
          // Simulate random cashouts
          if (Math.random() < 0.02) {
            const bets = store.liveBets.filter(b => !b.cashedOutAt && b.playerId.startsWith('bot'))
            if (bets.length > 0) {
              const bet = bets[Math.floor(Math.random() * bets.length)]
              store.updateLiveBet(bet.id, {
                cashedOutAt: currentMult,
                profit: Math.round(bet.amount * currentMult - bet.amount),
                status: 'won'
              })
            }
          }
          
          // Check if crashed
          if (currentMult >= crashPoint) {
            clearInterval(intervalId)
            store.setStatus('crashed')
            store.setMultiplier(crashPoint)
            
            // Add to history
            store.addToHistory({
              id: `round-${Date.now()}`,
              crashPoint: crashPoint,
              hash: generateRandomHash(),
              createdAt: new Date().toISOString()
            })
            
            // Mark uncashed bets as lost
            const currentBet = store.currentBet
            if (currentBet && currentBet.status === 'pending') {
              store.setCurrentBet({ ...currentBet, status: 'lost' })
            }
            
            // Wait and start new round
            timeoutId = setTimeout(runDemoRound, 4000)
          }
        }, 50)
        
      }, 10000)
    }
    
    // Start first demo round after a short delay
    timeoutId = setTimeout(runDemoRound, 2000)
    
    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
    }
  }, [isLoading])
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
         <main className="flex-1 w-full px-4 lg:px-8 py-6">
          <div className="max-w-[1800px] mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-8 space-y-6">
                <Skeleton className="h-[400px] rounded-xl" />
                <Skeleton className="h-[100px] rounded-xl" />
              </div>
              <div className="xl:col-span-4 space-y-6">
                <Skeleton className="h-[300px] rounded-xl" />
                <Skeleton className="h-[400px] rounded-xl" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 w-full px-4 lg:px-8 py-6">
        <div className="max-w-[1800px] mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Main Game Area */}
            <div className="xl:col-span-8 space-y-6">
              {/* Crash Graph */}
              <Card className="bg-card border-border overflow-hidden">
                <CrashGraph />
              </Card>
              
              {/* Game Stats */}
              <GameStats />
              
              {/* Round History */}
              <RoundHistory />
            </div>
            
            {/* Sidebar */}
            <div className="xl:col-span-4 space-y-6">
              {/* Login Prompt (if not authenticated) */}
              {!isAuthenticated && <LoginPrompt />}
              
              {/* Betting Controls */}
              <BettingControls />
              
              {/* Live Bets */}
              <LiveBets />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

// Helper functions for demo mode
function generateMockHistory(): RoundHistoryType[] {
  const history: RoundHistoryType[] = []
  for (let i = 0; i < 20; i++) {
    // Weighted random for more realistic distribution
    const random = Math.random()
    let crashPoint: number
    if (random < 0.33) {
      crashPoint = 1 + Math.random() * 0.5
    } else if (random < 0.66) {
      crashPoint = 1.5 + Math.random() * 1.5
    } else if (random < 0.9) {
      crashPoint = 3 + Math.random() * 4
    } else {
      crashPoint = 7 + Math.random() * 10
    }
    
    history.push({
      id: `round-${i}`,
      crashPoint: Number(crashPoint.toFixed(2)),
      hash: generateRandomHash(),
      createdAt: new Date(Date.now() - i * 60000).toISOString()
    })
  }
  return history
}

function generateRandomHash(): string {
  const chars = '0123456789abcdef'
  let hash = ''
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)]
  }
  return hash
}
