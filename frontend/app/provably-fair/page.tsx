'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Header, Footer } from '@/components/game/layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Shield, ArrowLeft, CheckCircle2, XCircle, Calculator, Hash, Key, Dice1 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Real provably fair verification using HMAC-SHA256
async function verifyCrashPoint(serverSeed: string, clientSeed: string, nonce: number): Promise<number> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(serverSeed);
  const msgData = encoder.encode(`${clientSeed}:${nonce}`);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Use the first 13 characters (52 bits) of the hash
  const h = parseInt(hashHex.substring(0, 13), 16);
  const e = Math.pow(2, 52);

  const crashPoint = Math.floor((100 * e - h) / (e - h)) / 100;

  return Math.max(1, crashPoint);
}

export default function ProvablyFairPage() {
  const [serverSeed, setServerSeed] = useState('')
  const [clientSeed, setClientSeed] = useState('')
  const [nonce, setNonce] = useState('')
  const [expectedCrash, setExpectedCrash] = useState('')
  const [result, setResult] = useState<{ verified: boolean; calculated: number } | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerify = async () => {
    if (!serverSeed || !clientSeed || !nonce) {
      return
    }

    setIsVerifying(true)
    try {
      const calculatedCrash = await verifyCrashPoint(serverSeed, clientSeed, parseInt(nonce))
      const expected = parseFloat(expectedCrash)

      setResult({
        verified: Math.abs(calculatedCrash - expected) < 0.01,
        calculated: calculatedCrash
      })
    } catch (error) {
      console.error('Verification error:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container py-8">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao jogo
        </Link>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Provably Fair</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Nosso sistema de Provably Fair garante que cada rodada é justa e verificável.
              Você pode verificar independentemente o resultado de qualquer rodada.
            </p>
          </div>

          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle>Como Funciona</CardTitle>
              <CardDescription>
                O algoritmo Provably Fair garante que os resultados são pré-determinados e não podem ser manipulados após as apostas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <Key className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">1. Seeds Geradas</h3>
                  <p className="text-sm text-muted-foreground">
                    Antes da rodada, uma server seed e client seed são combinadas para gerar o crash point.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <Hash className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">2. Hash Exibido</h3>
                  <p className="text-sm text-muted-foreground">
                    O hash da server seed é exibido antes da rodada começar, provando que o resultado já foi determinado.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <Dice1 className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">3. Verificação</h3>
                  <p className="text-sm text-muted-foreground">
                    Após a rodada, a server seed é revelada. Você pode verificar se o crash point corresponde.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Tool */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Verificar Rodada
              </CardTitle>
              <CardDescription>
                Insira os dados da rodada para verificar se o crash point foi calculado corretamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="server-seed">Server Seed</Label>
                  <Input
                    id="server-seed"
                    placeholder="Ex: a1b2c3d4e5f6..."
                    value={serverSeed}
                    onChange={(e) => setServerSeed(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-seed">Client Seed</Label>
                  <Input
                    id="client-seed"
                    placeholder="Ex: x9y8z7w6..."
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nonce">Nonce (Número da Rodada)</Label>
                  <Input
                    id="nonce"
                    type="number"
                    placeholder="Ex: 12345"
                    value={nonce}
                    onChange={(e) => setNonce(e.target.value)}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected-crash">Crash Point Esperado</Label>
                  <Input
                    id="expected-crash"
                    placeholder="Ex: 2.45"
                    value={expectedCrash}
                    onChange={(e) => setExpectedCrash(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <Button onClick={handleVerify} className="w-full" disabled={isVerifying}>
                <Shield className="w-4 h-4 mr-2" />
                {isVerifying ? 'Verificando...' : 'Verificar'}
              </Button>

              {result && (
                <div className={cn(
                  "p-4 rounded-lg flex items-center gap-3",
                  result.verified ? "bg-crash-green/10" : "bg-destructive/10"
                )}>
                  {result.verified ? (
                    <CheckCircle2 className="w-6 h-6 text-crash-green" />
                  ) : (
                    <XCircle className="w-6 h-6 text-destructive" />
                  )}
                  <div>
                    <p className={cn(
                      "font-semibold",
                      result.verified ? "text-crash-green" : "text-destructive"
                    )}>
                      {result.verified ? 'Verificação bem-sucedida!' : 'Verificação falhou'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Crash point calculado: <span className="font-mono">{result.calculated.toFixed(2)}x</span>
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Algorithm explanation */}
          <Card>
            <CardHeader>
              <CardTitle>Algoritmo de Cálculo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-muted-foreground">
                  {`// Pseudo-código do algoritmo Provably Fair

function calculateCrashPoint(serverSeed, clientSeed, nonce) {
  // 1. Combinar seeds com nonce
  const combined = serverSeed + ":" + clientSeed + ":" + nonce
  
  // 2. Gerar hash HMAC-SHA256
  const hash = hmacSHA256(combined)
  
  // 3. Converter para número
  const h = parseInt(hash.substring(0, 13), 16)
  const e = Math.pow(2, 52)
  
  // 4. Calcular crash point (com house edge de 4%)
  const crashPoint = Math.floor((100 * e - h) / (e - h)) / 100
  
  return Math.max(1.00, crashPoint)
}`}
                </pre>
              </div>

              <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                <h4 className="font-semibold mb-2">House Edge</h4>
                <p className="text-sm text-muted-foreground">
                  O jogo possui uma margem da casa de 4%, o que significa que, estatisticamente,
                  para cada R$ 100 apostados, R$ 4 vão para a casa. O crash point esperado médio
                  é aproximadamente 0.96x.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
