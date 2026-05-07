'use client'

import { useGameStore } from '@/stores/game-store'
import { useAuth } from '@/hooks/use-game'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gamepad2, LogIn, Users, Shield, Zap } from 'lucide-react'

export function LoginPrompt() {
  const { isAuthenticated } = useGameStore()
  const { login } = useAuth()
  
  if (isAuthenticated) return null
  
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <Gamepad2 className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Bem-vindo ao Crash Game!</CardTitle>
        <CardDescription>
          Entre para começar a jogar e tentar a sorte no multiplicador.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Features */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-crash-yellow" />
            </div>
            <p className="text-xs text-muted-foreground">Tempo Real</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Users className="w-5 h-5 text-crash-green" />
            </div>
            <p className="text-xs text-muted-foreground">Multiplayer</p>
          </div>
          <div className="space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Provably Fair</p>
          </div>
        </div>
        
        {/* Login Button */}
        <Button onClick={login} size="lg" className="w-full gap-2">
          <LogIn className="w-5 h-5" />
          Entrar com Keycloak
        </Button>
        
        {/* Test credentials */}
        <div className="text-center text-xs text-muted-foreground">
          <p>Usuário de teste: <span className="font-mono">player</span></p>
          <p>Senha: <span className="font-mono">player123</span></p>
        </div>
      </CardContent>
    </Card>
  )
}
