'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-game'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleCallback } = useAuth()
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')
  
  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    
    if (errorParam) {
      setStatus('error')
      setError(errorDescription || errorParam || 'Erro de autenticação')
      return
    }
    
    if (!code || !state) {
      setStatus('error')
      setError('Parâmetros de autenticação inválidos')
      return
    }
    
    handleCallback(code, state)
      .then(() => {
        setStatus('success')
        // Redirect to game after short delay
        setTimeout(() => {
          router.push('/')
        }, 1500)
      })
      .catch((err) => {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Erro ao processar autenticação')
      })
  }, [searchParams, handleCallback, router])
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {status === 'loading' && 'Autenticando...'}
            {status === 'success' && 'Login realizado!'}
            {status === 'error' && 'Erro de Autenticação'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground text-center">
                Processando sua autenticação...
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-12 h-12 text-crash-green" />
              <p className="text-muted-foreground text-center">
                Você será redirecionado para o jogo em instantes...
              </p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-destructive" />
              <p className="text-destructive text-center">
                {error}
              </p>
              <Button onClick={() => router.push('/')} variant="outline">
                Voltar para o início
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
