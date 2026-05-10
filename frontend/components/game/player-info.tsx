'use client'

import { useGameStore } from '@/stores/game-store'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Wallet, LogIn, LogOut, User, ChevronDown, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-game'
import { cn } from '@/lib/utils'
import { redirect } from 'next/navigation'

// Format cents to BRL
function formatCurrency(cents: bigint | number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(cents) / 100)
}

export function PlayerInfo() {
  const { user, isAuthenticated, wallet } = useGameStore()
  
  const login =() => {
    redirect('/login')
  }
  
  if (!isAuthenticated) {
    return (
      <Button onClick={login} className="gap-2">
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Entrar</span>
      </Button>
    )
  }
  
  return (
    <div className="flex items-center gap-3">
      {/* Balance Display */}
      <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg">
        <Wallet className="w-4 h-4 text-crash-green" />
        <span className={cn(
          "font-mono font-bold",
          wallet ? "text-crash-green" : "text-muted-foreground"
        )}>
          {wallet ? formatCurrency(wallet.balance) : (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
        </span>
      </div>
      
      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              {user?.username?.slice(0, 2).toUpperCase() || 'U'}
            </div>
            <span className="hidden sm:inline max-w-[100px] truncate">
              {user?.username || 'Jogador'}
            </span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user?.username}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="w-4 h-4 mr-2" />
            Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Wallet className="w-4 h-4 mr-2" />
            Minhas Apostas
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={login} className="text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
