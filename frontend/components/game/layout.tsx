'use client'

import Link from 'next/link'
import { PlayerInfo } from './player-info'
import { Gamepad2, Shield, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground">
              Jungle Gaming
            </h1>
            <p className="text-xs text-muted-foreground -mt-1">
              Crash Game
            </p>
          </div>
        </Link>
        
        {/* Center - Provably Fair Badge */}
        <div className="hidden md:flex flex-1 justify-center">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full">
            <Shield className="w-4 h-4 text-crash-green" />
            <span className="text-xs text-muted-foreground">
              Provably Fair
            </span>
          </div>
        </div>
        
        {/* Right - Player Info */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
            <a 
              href="https://github.com/junglegaming/fullstack-challenge" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Github className="w-5 h-5" />
            </a>
          </Button>
          <PlayerInfo />
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/provably-fair" className="hover:text-foreground transition-colors">
              Provably Fair
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacidade
            </Link>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Gamepad2 className="w-4 h-4 text-primary" />
            <span>© 2026 Jogue com responsabilidade.</span>
          </div>
        </div>
        
        {/* Responsible Gaming Notice */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            🔞 Jogos de azar são para maiores de 18 anos. Jogar envolve riscos financeiros. 
            Se você ou alguém que conhece tem problemas com jogos, procure ajuda profissional.
          </p>
        </div>
      </div>
    </footer>
  )
}
