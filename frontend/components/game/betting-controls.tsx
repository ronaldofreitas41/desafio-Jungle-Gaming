'use client'

import { useState, useCallback } from 'react'
import { useGameStore } from '@/stores/game-store'
import { apiService } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Rocket, HandCoins, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Format cents to BRL
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cents / 100)
}

// Parse input to cents
function parseToCents(value: string): number {
  const parsed = parseFloat(value.replace(',', '.'))
  return isNaN(parsed) ? 0 : Math.round(parsed * 100)
}

const QUICK_AMOUNTS = [100, 500, 1000, 2500, 5000, 10000] // in cents

export function BettingControls() {
  const {
    status,
    isAuthenticated,
    wallet,
    currentBet,
    multiplier,
    isPlacingBet,
    isCashingOut,
    setIsPlacingBet,
    setIsCashingOut,
    setCurrentBet,
    updateBalance
  } = useGameStore()
  
  const [betAmount, setBetAmount] = useState('')
  const [autoCashOut, setAutoCashOut] = useState('')
  
  const canBet = status === 'betting' && isAuthenticated && !currentBet && !isPlacingBet
  const canCashOut = status === 'running' && currentBet?.status === 'pending' && !isCashingOut
  
  const handlePlaceBet = useCallback(async () => {
    const amountCents = parseToCents(betAmount)
    
    // Validations
    if (amountCents < 100) {
      toast.error('Aposta mínima é R$ 1,00')
      return
    }
    
    if (amountCents > 100000) {
      toast.error('Aposta máxima é R$ 1.000,00')
      return
    }
    
    if (wallet && amountCents > wallet.balance) {
      toast.error('Saldo insuficiente')
      return
    }
    
    setIsPlacingBet(true)
    
    try {
      const bet = await apiService.placeBet(amountCents)
      setCurrentBet(bet)
      
      // Update balance locally (will be synced via WebSocket)
      if (wallet) {
        updateBalance(wallet.balance - amountCents)
      }
      
      toast.success(`Aposta de ${formatCurrency(amountCents)} realizada!`)
      setBetAmount('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer aposta')
    } finally {
      setIsPlacingBet(false)
    }
  }, [betAmount, wallet, setIsPlacingBet, setCurrentBet, updateBalance])
  
  const handleCashOut = useCallback(async () => {
    if (!currentBet) return
    
    setIsCashingOut(true)
    
    try {
      const result = await apiService.cashOut()
      setCurrentBet(result)
      
      // Update balance locally
      if (wallet && result.profit) {
        updateBalance(wallet.balance + currentBet.amount + result.profit)
      }
      
      toast.success(
        `Cash out em ${multiplier.toFixed(2)}x! Ganho: ${formatCurrency(result.profit || 0)}`
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer cash out')
    } finally {
      setIsCashingOut(false)
    }
  }, [currentBet, multiplier, wallet, setIsCashingOut, setCurrentBet, updateBalance])
  
  const handleQuickAmount = (amount: number) => {
    setBetAmount((amount / 100).toFixed(2).replace('.', ','))
  }
  
  const potentialWin = currentBet 
    ? currentBet.amount * multiplier 
    : parseToCents(betAmount) * (multiplier || 1)
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          Controles de Aposta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Faça login para apostar
            </p>
          </div>
        ) : (
          <>
            {/* Bet Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="bet-amount">Valor da Aposta (R$)</Label>
              <Input
                id="bet-amount"
                type="text"
                placeholder="0,00"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                disabled={!canBet}
                className="font-mono text-lg h-12"
              />
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(amount)}
                  disabled={!canBet}
                  className="font-mono text-xs"
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
            
            {/* Auto Cash Out (Bônus) */}
            <div className="space-y-2">
              <Label htmlFor="auto-cashout">Auto Cash Out (opcional)</Label>
              <div className="flex gap-2">
                <Input
                  id="auto-cashout"
                  type="text"
                  placeholder="2.00"
                  value={autoCashOut}
                  onChange={(e) => setAutoCashOut(e.target.value)}
                  disabled={!canBet}
                  className="font-mono"
                />
                <span className="flex items-center text-muted-foreground">x</span>
              </div>
            </div>
            
            {/* Potential Win Display */}
            {(currentBet || parseToCents(betAmount) > 0) && (
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ganho Potencial</span>
                  <span className={cn(
                    "font-mono font-bold",
                    status === 'running' ? "text-crash-green" : "text-foreground"
                  )}>
                    {formatCurrency(Math.round(potentialWin))}
                  </span>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-2">
              {!currentBet ? (
                <Button
                  className={cn(
                    "w-full h-14 text-lg font-bold transition-all",
                    canBet && "animate-pulse-glow bg-primary hover:bg-primary/90"
                  )}
                  onClick={handlePlaceBet}
                  disabled={!canBet}
                >
                  {isPlacingBet ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Apostando...
                    </>
                  ) : status === 'betting' ? (
                    <>
                      <Rocket className="w-5 h-5 mr-2" />
                      APOSTAR
                    </>
                  ) : (
                    'Aguarde a próxima rodada'
                  )}
                </Button>
              ) : currentBet.status === 'pending' ? (
                <Button
                  className={cn(
                    "w-full h-14 text-lg font-bold transition-all",
                    canCashOut && "glow-green bg-crash-green hover:bg-crash-green/90 text-background"
                  )}
                  onClick={handleCashOut}
                  disabled={!canCashOut}
                >
                  {isCashingOut ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sacando...
                    </>
                  ) : (
                    <>
                      <HandCoins className="w-5 h-5 mr-2" />
                      CASH OUT - {formatCurrency(Math.round(potentialWin))}
                    </>
                  )}
                </Button>
              ) : (
                <div className={cn(
                  "w-full h-14 flex items-center justify-center rounded-lg font-bold",
                  currentBet.status === 'won' 
                    ? "bg-crash-green/20 text-crash-green" 
                    : "bg-destructive/20 text-destructive"
                )}>
                  {currentBet.status === 'won' 
                    ? `🎉 Você ganhou ${formatCurrency(currentBet.profit || 0)}!` 
                    : '💥 Você perdeu!'}
                </div>
              )}
            </div>
            
            {/* Current Bet Info */}
            {currentBet && (
              <div className="text-sm text-muted-foreground text-center">
                Aposta atual: {formatCurrency(currentBet.amount)}
                {currentBet.cashedOutAt && ` @ ${currentBet.cashedOutAt.toFixed(2)}x`}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
