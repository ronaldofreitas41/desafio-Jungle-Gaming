'use client'

import { useGameStore } from '@/stores/game-store'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react'

export function GameStats() {
  const { roundHistory, status, multiplier } = useGameStore()
  
  // Calculate stats
  const last10 = roundHistory.slice(0, 10)
  const avgCrash = last10.length > 0 
    ? last10.reduce((sum, r) => sum + r.crashPoint, 0) / last10.length 
    : 0
  
  const highestRecent = last10.length > 0 
    ? Math.max(...last10.map(r => r.crashPoint)) 
    : 0
  
  const lowestRecent = last10.length > 0 
    ? Math.min(...last10.map(r => r.crashPoint)) 
    : 0
  
  const crashBelow2Count = last10.filter(r => r.crashPoint < 2).length
  const streak = calculateStreak(roundHistory)
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        icon={<TrendingUp className="w-4 h-4" />}
        label="Média (últimas 10)"
        value={`${avgCrash.toFixed(2)}x`}
        trend={avgCrash >= 2 ? 'up' : 'down'}
      />
      <StatCard
        icon={<Zap className="w-4 h-4" />}
        label="Maior recente"
        value={`${highestRecent.toFixed(2)}x`}
        trend="up"
      />
      <StatCard
        icon={<TrendingDown className="w-4 h-4" />}
        label="Menor recente"
        value={`${lowestRecent.toFixed(2)}x`}
        trend="down"
      />
      <StatCard
        icon={<Clock className="w-4 h-4" />}
        label={`Abaixo de 2x`}
        value={`${crashBelow2Count}/10`}
        trend={crashBelow2Count > 5 ? 'down' : 'up'}
      />
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  trend 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  trend: 'up' | 'down'
}) {
  return (
    <div className="bg-secondary/30 rounded-lg p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className={cn(
        "font-mono font-bold text-lg",
        trend === 'up' ? "text-crash-green" : "text-crash-red"
      )}>
        {value}
      </div>
    </div>
  )
}

function calculateStreak(history: { crashPoint: number }[]): { type: 'above' | 'below'; count: number } {
  if (history.length === 0) return { type: 'above', count: 0 }
  
  const threshold = 2
  const firstAbove = history[0].crashPoint >= threshold
  let count = 0
  
  for (const round of history) {
    const isAbove = round.crashPoint >= threshold
    if (isAbove === firstAbove) {
      count++
    } else {
      break
    }
  }
  
  return { type: firstAbove ? 'above' : 'below', count }
}
