import { Header, Footer } from '@/components/game/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao jogo
        </Link>
        
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Termos de Uso</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                Última atualização: Janeiro de 2024
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                Ao acessar e usar o Crash Game da Jungle Gaming, você concorda em cumprir estes termos de uso. 
                Se não concordar com qualquer parte destes termos, não utilize nossos serviços.
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">2. Elegibilidade</h2>
              <p className="text-muted-foreground">
                Você deve ter pelo menos 18 anos de idade para usar nossos serviços. Ao usar o Crash Game, 
                você confirma que atende a este requisito de idade.
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">3. Conta do Usuário</h2>
              <p className="text-muted-foreground">
                Você é responsável por manter a confidencialidade de suas credenciais de login e por todas 
                as atividades realizadas em sua conta.
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">4. Jogo Responsável</h2>
              <p className="text-muted-foreground">
                Jogos de azar podem ser viciantes. Jogue com responsabilidade e nunca aposte mais do que 
                pode perder. Se você ou alguém que conhece tiver problemas com jogos, procure ajuda profissional.
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">5. Provably Fair</h2>
              <p className="text-muted-foreground">
                Nosso sistema utiliza algoritmos verificáveis para garantir a justiça de cada rodada. 
                Você pode verificar independentemente o resultado de qualquer rodada usando os dados 
                fornecidos em nossa página de Provably Fair.
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">6. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground">
                A Jungle Gaming não será responsável por quaisquer perdas ou danos resultantes do uso 
                de nossos serviços, incluindo perdas financeiras decorrentes de apostas.
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">7. Alterações nos Termos</h2>
              <p className="text-muted-foreground">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações 
                entrarão em vigor imediatamente após a publicação.
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">8. Contato</h2>
              <p className="text-muted-foreground">
                Para dúvidas sobre estes termos, entre em contato conosco através do email: 
                contato@junglegaming.com
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
