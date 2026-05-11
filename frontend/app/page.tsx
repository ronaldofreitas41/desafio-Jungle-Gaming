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
    setRoundHistory,
    addLiveBet,
    setCurrentRound,
    setStatus,
    setMultiplier
    } = useGameStore()

  // Conecta ao WebSocket e gerencia autenticação
  useWebSocket()
  useAuth()

  // Define o token da API quando o usuário muda
  useEffect(() => {
    if (user?.accessToken) {
      apiService.setAccessToken(user.accessToken)
    }
  }, [user?.accessToken])

  // Busca dados iniciais ao carregar a página
  useEffect(() => {
    async function fetchInitialData() {
      try {
        // Busca a rodada atual
        try {
          const currentRound = await apiService.getCurrentRound()
          setCurrentRound(currentRound)
          currentRound.bets?.forEach((bet: any) => addLiveBet({
            ...bet,
            amount: BigInt(bet.amount),
            profit: bet.profit ? BigInt(bet.profit) : undefined
          }))
        } catch {
          // Caso não haja rodada ativa, inicia em estado de espera
          setStatus('waiting')
          setMultiplier(1.00)
        }

        // Busca o histórico de rodadas
        try {
          const history = await apiService.getRoundHistory()
          setRoundHistory(history)
        } catch {
          // Usa dados mockados caso a API falhe
          setRoundHistory(generateMockHistory())
        }
      } catch (error) {
        console.error('Erro ao buscar dados iniciais:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [setRoundHistory, addLiveBet, setCurrentRound, setStatus, setMultiplier])

  // Exibe skeleton loader enquanto carrega
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
            {/* Área Principal do Jogo */}
            <div className="xl:col-span-8 space-y-6">
              {/* Gráfico do Crash */}
              <Card className="bg-card border-border overflow-hidden">
                <CrashGraph />
              </Card>

              {/* Estatísticas do Jogo */}
              <GameStats />

              {/* Histórico de Rodadas */}
              <RoundHistory />
            </div>

            {/* Barra Lateral */}
            <div className="xl:col-span-4 space-y-6">
              {/* Prompt de Login (se não autenticado) */}
              {!isAuthenticated && <LoginPrompt />}

              {/* Controles de Aposta */}
              <BettingControls />

              {/* Apostas ao Vivo */}
              <LiveBets />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// Funções auxiliares para o modo demonstração
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
