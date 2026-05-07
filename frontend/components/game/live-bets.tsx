'use client'

import { useGameStore } from '@/stores/game-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Format cents to BRL
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
}

export function LiveBets() {
  const { liveBets, user } = useGameStore()
  
  // Sort bets: cashed out first, then by amount
  const sortedBets = [...liveBets].sort((a, b) => {
    if (a.cashedOutAt && !b.cashedOutAt) return -1
    if (!a.cashedOutAt && b.cashedOutAt) return 1
    return b.amount - a.amount
  })
  
  const totalBets = liveBets.length
  const totalAmount = liveBets.reduce((sum, bet) => sum + bet.amount, 0)
  
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
                
                return (
                  <div
                    key={bet.id}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 transition-colors",
                      isCurrentUser && "bg-primary/5",
                      hasCashedOut && "bg-crash-green/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar placeholder */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                        hasCashedOut 
                          ? "bg-crash-green/20 text-crash-green" 
                          : "bg-secondary text-secondary-foreground"
                      )}>
                        {bet.playerName.slice(0, 2).toUpperCase()}
                      </div>
                      
                      <div>
                        <div className={cn(
                          "font-medium text-sm",
                          isCurrentUser && "text-primary"
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
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-crash-green" />
                          <div>
                            <div className="text-sm font-mono text-crash-green">
                              {bet.cashedOutAt?.toFixed(2)}x
                            </div>
                            <div className="text-xs text-crash-green">
                              +{formatCurrency(bet.profit || 0)}
                            </div>
                          </div>
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
