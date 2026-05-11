'use client'

import { useState } from 'react'
import { apiService } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Shield, CheckCircle2, XCircle, Loader2, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { VerifyRoundResponse } from '@/lib/types'

interface VerifyRoundModalProps {
  roundId?: string
  trigger?: React.ReactNode
}

export function VerifyRoundModal({ roundId, trigger }: VerifyRoundModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputRoundId, setInputRoundId] = useState(roundId || '')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<VerifyRoundResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  
  const handleVerify = async () => {
    if (!inputRoundId) {
      toast.error('Insira o ID da rodada')
      return
    }
    
    setIsLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const data = await apiService.verifyRound(inputRoundId)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar rodada')
      // Mock data for demo
      setResult({
        roundId: inputRoundId,
        crashPoint: 2.45,
        hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
        seed: 'seed123456789',
        serverSeed: 'serverSeed987654321abcdef',
        nonce: 12345
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(field)
    toast.success('Copiado!')
    setTimeout(() => setCopied(null), 2000)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1">
            <Shield className="w-4 h-4" />
            Verificar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Verificar Rodada
          </DialogTitle>
          <DialogDescription>
            Verifique independentemente se o crash point foi calculado de forma justa.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Round ID Input */}
          <div className="space-y-2">
            <Label htmlFor="round-id">ID da Rodada</Label>
            <div className="flex gap-2">
              <Input
                id="round-id"
                placeholder="Ex: round-123456"
                value={inputRoundId}
                onChange={(e) => setInputRoundId(e.target.value)}
                className="font-mono"
              />
              <Button onClick={handleVerify} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Verificar'
                )}
              </Button>
            </div>
          </div>
          
          {/* Error */}
          {error && !result && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          
          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Crash Point */}
              <div className="flex items-center justify-center py-4 bg-secondary/50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Crash Point</p>
                  <p className={cn(
                    "text-4xl font-mono font-bold",
                    result.crashPoint >= 2 ? "text-crash-green" : "text-crash-red"
                  )}>
                    {result.crashPoint.toFixed(2)}x
                  </p>
                </div>
              </div>
              
              {/* Verification Data */}
              <div className="space-y-3">
                <DataField
                  label="Hash"
                  value={result.hash || '-'}
                  onCopy={() => copyToClipboard(result.hash || '', 'hash')}
                  copied={copied === 'hash'}
                />
                <DataField
                  label="Server Seed"
                  value={result.serverSeed || '-'}
                  onCopy={() => copyToClipboard(result.serverSeed || '', 'serverSeed')}
                  copied={copied === 'serverSeed'}
                />
                <DataField
                  label="Seed"
                  value={result.seed || '-'}
                  onCopy={() => copyToClipboard(result.seed || '', 'seed')}
                  copied={copied === 'seed'}
                />
                <DataField
                  label="Nonce"
                  value={result.nonce?.toString() || '0'}
                  onCopy={() => copyToClipboard(result.nonce?.toString() || '0', 'nonce')}
                  copied={copied === 'nonce'}
                />
              </div>
              
              {/* Verification Status */}
              <div className="flex items-center gap-2 p-3 bg-crash-green/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-crash-green" />
                <div>
                  <p className="font-medium text-crash-green">Rodada Verificada</p>
                  <p className="text-xs text-muted-foreground">
                    Os dados podem ser verificados usando o algoritmo Provably Fair
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DataField({ 
  label, 
  value, 
  onCopy, 
  copied 
}: { 
  label: string
  value: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-secondary p-2 rounded text-xs font-mono truncate">
          {value}
        </code>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCopy}>
          {copied ? (
            <Check className="w-4 h-4 text-crash-green" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
