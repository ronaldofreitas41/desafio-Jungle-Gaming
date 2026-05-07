'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { authService } from '@/services/auth'
import { Rocket, TrendingUp, Shield, Users, ArrowRight, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  useEffect(() => {
    // Check if already logged in
    const user = authService.getStoredUser()
    if (user && !authService.isTokenExpired(user.accessToken)) {
      router.push('/')
    }
  }, [router])

  const handleKeycloakLogin = async () => {
    setIsLoading(true)
    try {
      await authService.login()
    } catch (error) {
      console.error('Erro ao iniciar login:', error)
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Para login direto, redirecionamos para o Keycloak
    handleKeycloakLogin()
  }

  const features = [
    {
      icon: TrendingUp,
      title: 'Multiplicadores Altos',
      description: 'Ganhe até 1000x sua aposta'
    },
    {
      icon: Shield,
      title: 'Provably Fair',
      description: 'Sistema verificável e transparente'
    },
    {
      icon: Users,
      title: 'Multiplayer',
      description: 'Jogue com milhares de jogadores'
    }
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px),
                               linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-destructive/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <Rocket className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-primary to-accent rounded-xl blur opacity-30" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Crash Game</h1>
              <p className="text-muted-foreground text-sm">A emoção do multiplicador</p>
            </div>
          </div>

          {/* Main headline */}
          <h2 className="text-4xl xl:text-5xl font-bold text-foreground mb-6 leading-tight">
            Aposte, observe e{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              multiplique
            </span>{' '}
            seus ganhos
          </h2>

          <p className="text-lg text-muted-foreground mb-12 max-w-lg">
            Entre na plataforma mais emocionante de crash games. 
            Acompanhe o multiplicador subir e faça cash out no momento certo.
          </p>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-12 mt-12 pt-8 border-t border-border">
            <div>
              <p className="text-3xl font-bold text-foreground">50K+</p>
              <p className="text-sm text-muted-foreground">Jogadores ativos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">R$ 2M+</p>
              <p className="text-sm text-muted-foreground">Pagos em prêmios</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground">99.9%</p>
              <p className="text-sm text-muted-foreground">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <Rocket className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Crash Game</h1>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl shadow-black/20">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">Bem-vindo de volta</CardTitle>
              <CardDescription className="text-center">
                Entre na sua conta para começar a jogar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* OAuth Login Button */}
              <Button
                onClick={handleKeycloakLogin}
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Conectando...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span>Entrar com Keycloak</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-xs text-muted-foreground">
                  ou continue com email
                </span>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-12 bg-background border-border focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">Senha</Label>
                    <Link 
                      href="/forgot-password" 
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-12 bg-background border-border focus:border-primary focus:ring-primary/20 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Lembrar de mim
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-12 border-border hover:bg-muted hover:border-primary/50 transition-all"
                >
                  Entrar com Email
                </Button>
              </form>

              {/* Register Link */}
              <p className="text-center text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <Link 
                  href="/register" 
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Criar conta
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Ao entrar, você concorda com nossos{' '}
              <Link href="/terms" className="text-primary hover:underline">Termos de Uso</Link>
              {' '}e{' '}
              <Link href="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
            </p>
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-12 grid grid-cols-3 gap-4 text-center">
            {features.map((feature, index) => (
              <div key={index} className="space-y-2">
                <div className="w-10 h-10 mx-auto rounded-lg bg-card border border-border flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">{feature.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
