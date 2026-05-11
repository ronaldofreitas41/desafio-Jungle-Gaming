'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/game-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatCurrency(cents: number | bigint): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(cents) / 100)
}

export function LiveBets() {
  const { liveBets: storeLiveBets, user, currentRound, status, multiplier } = useGameStore()

  // Gera apostas fictícias apenas uma vez por rodada
  const fakeBets = useMemo(() => {
    const count = Math.floor(Math.random() * 30) + 1
    const names = [
      'Gabriel', 'Ana', 'Lucas', 'Mariana', 'Pedro', 'Julia', 'Bruno', 'Beatriz', 'Felipe', 'Camila',
      'Thiago', 'Larissa', 'Vinícius', 'Isabela', 'Gustavo', 'Letícia', 'Rafael', 'Amanda', 'Leonardo', 'Fernanda',
      'Matheus', 'Bianca', 'Rodrigo', 'Carolina', 'Guilherme', 'Priscila', 'André', 'Patrícia', 'Diego', 'Vanessa'
    ]

    return Array.from({ length: count }).map((_, i) => {
      const amount = BigInt(Math.floor(Math.random() * (200000 - 100 + 1)) + 100)
      // Cada bot tem um multiplicador alvo aleatório entre 1.1x e 5x para saque automático
      const cashOutTarget = Number((Math.random() * 4 + 1.1).toFixed(2))

      return {
        id: `fake-${i}`,
        playerId: `bot-${i}`,
        playerName: names[i % names.length] + ' ' + (Math.floor(Math.random() * 90) + 10),
        amount,
        cashOutTarget, // ← multiplicador alvo do bot
        cashedOutAt: undefined as number | undefined,
        profit: 0n as bigint,
        status: 'pending' as string,
        createdAt: new Date().toISOString(),
      }
    })
  }, [currentRound?.id])

  // Ref para guardar o estado mutável dos bots sem re-renders desnecessários
  const fakeBetsStateRef = useRef(fakeBets.map(b => ({ ...b })))

  // Reseta os bots quando a rodada muda
  useEffect(() => {
    fakeBetsStateRef.current = fakeBets.map(b => ({ ...b }))
  }, [fakeBets])

  // Simula saques automáticos dos bots conforme o multiplicador sobe
  const simulatedBets = useMemo(() => {
    if (status === 'crashed') {
      // Rodada crashou — quem não sacou perde
      return fakeBetsStateRef.current.map(bet => {
        if (bet.cashedOutAt) return bet
        return { ...bet, status: 'lost' }
      })
    }

    if (status === 'running') {
      // Saca os bots que atingiram o multiplicador alvo
      return fakeBetsStateRef.current.map(bet => {
        if (bet.cashedOutAt) return bet
        if (multiplier >= bet.cashOutTarget) {
          const cashedOutAt = bet.cashOutTarget
          const profit = BigInt(Math.floor(Number(bet.amount) * (cashedOutAt - 1)))
          const updated = { ...bet, cashedOutAt, profit, status: 'won' }
          // Persiste o saque no ref para não reverter no próximo tick
          const idx = fakeBetsStateRef.current.findIndex(b => b.id === bet.id)
          if (idx !== -1) fakeBetsStateRef.current[idx] = updated
          return updated
        }
        return bet
      })
    }

    return fakeBetsStateRef.current
  }, [multiplier, status, currentRound?.id])

  const liveBets = [...storeLiveBets, ...simulatedBets]

  // Ordena: sacados primeiro, depois perdedores, depois pendentes — por valor
  const sortedBets = [...liveBets].sort((a, b) => {
    if (a.cashedOutAt && !b.cashedOutAt) return -1
    if (!a.cashedOutAt && b.cashedOutAt) return 1
    return Number(b.amount) - Number(a.amount)
  })

  const totalBets = liveBets.length
  const totalAmount = liveBets.reduce((sum, bet) => sum + Number(bet.amount), 0)

  return (
    <Card className="bg-card border-border h-full max-h-[500px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Apostas ao Vivo
          </div>
          <span className="text-sm font-normal text-muted-foreground">
            {totalBets} apostas • {formatCurrency(totalAmount)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] md:h-[400px]">
          {sortedBets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <Users className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma aposta nesta rodada</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedBets.map((bet) => {
                const isCurrentUser = user?.id === bet.playerId
                const hasCashedOut = !!bet.cashedOutAt
                const hasLost = status === 'crashed' && !hasCashedOut

                // Valor atual da aposta multiplicado pelo multiplicador atual
                const currentValue = status === 'running' && !hasCashedOut
                  ? BigInt(Math.floor(Number(bet.amount) * multiplier))
                  : null

                return (
                  <div
                    key={bet.id}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 transition-colors",
                      isCurrentUser && "bg-primary/5",
                      hasCashedOut && "bg-green-500/5",
                      hasLost && "bg-red-500/5",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        hasCashedOut && "bg-green-500/20 text-green-500",
                        hasLost && "bg-red-500/20 text-red-500",
                        !hasCashedOut && !hasLost && "bg-secondary text-secondary-foreground"
                      )}>
                        {bet.playerName.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div className={cn(
                          "font-medium text-sm",
                          isCurrentUser && "text-primary",
                          hasLost && "text-red-500",   // ← vermelho para quem perdeu
                          hasCashedOut && "text-green-500"
                        )}>
                          {bet.playerName}
                          {isCurrentUser && (
                            <span className="ml-1 text-xs text-primary">(você)</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(bet.amount)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {hasCashedOut ? (
                        // Sacou — mostra multiplicador e lucro
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <div>
                            <div className="text-sm font-mono text-green-500">
                              {bet.cashedOutAt?.toFixed(2)}x
                            </div>
                            <div className="text-xs text-green-500">
                              +{formatCurrency(bet.profit || 0n)}
                            </div>
                          </div>
                        </div>
                      ) : hasLost ? (
                        // Crashou sem sacar — mostra perda
                        <div className="flex items-center gap-1">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <div className="text-sm font-mono text-red-500">
                            -{formatCurrency(bet.amount)}
                          </div>
                        </div>
                      ) : currentValue ? (
                        // Rodada a correr — mostra valor atual em tempo real
                        <div className="text-sm font-mono text-yellow-400">
                          {formatCurrency(currentValue)}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Aguardando...
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}