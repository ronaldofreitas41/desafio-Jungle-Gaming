'use client'

import { useGameStore } from '@/stores/game-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VerifyRoundModal } from './verify-round-modal'
import { History, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

function getCrashColor(crashPoint: number): string {
  if (crashPoint < 1.5) return 'bg-destructive text-destructive-foreground'
  if (crashPoint < 2.0) return 'bg-crash-yellow text-background'
  if (crashPoint < 5.0) return 'bg-crash-green text-background'
  return 'bg-primary text-primary-foreground'
}

function getCrashRingColor(crashPoint: number): string {
  if (crashPoint < 1.5) return 'ring-destructive'
  if (crashPoint < 2.0) return 'ring-crash-yellow'
  if (crashPoint < 5.0) return 'ring-crash-green'
  return 'ring-primary'
}

export function RoundHistory() {
  const { roundHistory } = useGameStore()
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Histórico de Rodadas
          </div>
          <VerifyRoundModal />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {roundHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <History className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhuma rodada registrada</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {roundHistory.slice(0, 20).map((round, index) => (
              <VerifyRoundModal 
                key={round.id} 
                roundId={round.id}
                trigger={
                  <button
                    className={cn(
                      "group relative px-3 py-1.5 rounded-md font-mono text-sm font-bold transition-all",
                      "ring-1 ring-inset hover:ring-2 cursor-pointer",
                      getCrashColor(round.crashPoint),
                      getCrashRingColor(round.crashPoint),
                      index === 0 && "animate-float"
                    )}
                    title={`Rodada ${round.id} - Clique para verificar`}
                  >
                    {round.crashPoint.toFixed(2)}x
                    
                    {/* Provably Fair indicator */}
                    <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Shield className="w-3 h-3 text-crash-green" />
                    </div>
                  </button>
                }
              />
            ))}
          </div>
        )}
        
        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-destructive" />
              <span>{'< 1.5x'}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-crash-yellow" />
              <span>1.5x - 2x</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-crash-green" />
              <span>2x - 5x</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-primary" />
              <span>{'> 5x'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
