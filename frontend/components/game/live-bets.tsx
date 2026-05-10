'use client'

import { useMemo } from 'react'
import { useGameStore } from '@/stores/game-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Formata para Real (handles both number and bigint)
function formatCurrency(cents: number | bigint): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(cents) / 100)
}

// Componente que exibe as apostas em tempo real da rodada atual
export function LiveBets() {
  const { liveBets: storeLiveBets, user, currentRound } = useGameStore()

  // Gerar apostas fictícias (bots) para preencher a lista e dar "vida" ao jogo
  // Regenera sempre que uma nova rodada começa
  const fakeBets = useMemo(() => {
    // Quantidade aleatória de 1 a 30 pessoas
    const count = Math.floor(Math.random() * 30) + 1;

    const names = [
      'Gabriel', 'Ana', 'Lucas', 'Mariana', 'Pedro', 'Julia', 'Bruno', 'Beatriz', 'Felipe', 'Camila',
      'Thiago', 'Larissa', 'Vinícius', 'Isabela', 'Gustavo', 'Letícia', 'Rafael', 'Amanda', 'Leonardo', 'Fernanda',
      'Matheus', 'Bianca', 'Rodrigo', 'Carolina', 'Guilherme', 'Priscila', 'André', 'Patrícia', 'Diego', 'Vanessa'
    ];

    return Array.from({ length: count }).map((_, i) => {
      // Valor aleatório entre 1,00 R$ (100 centavos) até 2000,00 R$ (200000 centavos)
      const amount = BigInt(Math.floor(Math.random() * (200000 - 100 + 1)) + 100);

      // Simular alguns saques aleatórios para parecer real (apenas visual)
      const hasCashedOut = Math.random() > 0.7;
      const cashedOutAt = hasCashedOut ? Number((Math.random() * 3 + 1.1).toFixed(2)) : undefined;
      const profit = cashedOutAt ? BigInt(Math.floor(Number(amount) * (cashedOutAt - 1))) : 0n;

      return {
        id: `fake-${i}`,
        playerId: `bot-${i}`,
        playerName: names[i % names.length] + ' ' + (Math.floor(Math.random() * 90) + 10),
        amount,
        cashedOutAt,
        profit,
        status: hasCashedOut ? 'won' : 'pending',
        createdAt: new Date().toISOString(),
      };
    });
  }, [currentRound?.id]);

  // Combina as apostas reais com as geradas aleatoriamente
  const liveBets = [...storeLiveBets, ...fakeBets];

  // Ordena as apostas: quem já sacou primeiro, depois por valor
  const sortedBets = [...liveBets].sort((a, b) => {
    const aHasCashedOut = !!a.cashedOutAt
    const bHasCashedOut = !!b.cashedOutAt

    if (aHasCashedOut && !bHasCashedOut) return -1
    if (!aHasCashedOut && bHasCashedOut) return 1

    // Convert BigInt to number for sorting comparison
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
                      {/* Avatar baseado nas iniciais do jogador */}
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
                              +{formatCurrency(bet.profit || 0n)}
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
