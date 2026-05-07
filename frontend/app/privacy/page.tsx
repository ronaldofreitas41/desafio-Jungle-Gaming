import { Header, Footer } from '@/components/game/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
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
              <CardTitle className="text-2xl">Política de Privacidade</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-muted-foreground">
                Última atualização: Maio de 2026
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">1. Informações que Coletamos</h2>
              <p className="text-muted-foreground">
                Coletamos informações que você nos fornece diretamente, como nome de usuário, 
                email e informações de conta. Também coletamos dados automaticamente quando 
                você usa nossos serviços, incluindo histórico de apostas e atividades de jogo.
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">2. Como Usamos Suas Informações</h2>
              <p className="text-muted-foreground">
                Utilizamos suas informações para:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Fornecer e manter nossos serviços</li>
                <li>Processar transações e apostas</li>
                <li>Enviar comunicações importantes sobre sua conta</li>
                <li>Detectar e prevenir fraudes</li>
                <li>Melhorar nossos serviços</li>
              </ul>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">3. Compartilhamento de Informações</h2>
              <p className="text-muted-foreground">
                Não vendemos suas informações pessoais. Podemos compartilhar informações com 
                prestadores de serviços que nos auxiliam na operação da plataforma, sempre sob 
                rigorosos acordos de confidencialidade.
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">4. Segurança dos Dados</h2>
              <p className="text-muted-foreground">
                Implementamos medidas de segurança técnicas e organizacionais para proteger 
                suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">5. Seus Direitos</h2>
              <p className="text-muted-foreground">
                Você tem o direito de:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Acessar suas informações pessoais</li>
                <li>Corrigir dados imprecisos</li>
                <li>Solicitar a exclusão de seus dados</li>
                <li>Retirar seu consentimento a qualquer momento</li>
              </ul>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">6. Cookies</h2>
              <p className="text-muted-foreground">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência, 
                analisar o tráfego do site e personalizar conteúdo.
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">7. Alterações nesta Política</h2>
              <p className="text-muted-foreground">
                Podemos atualizar esta política periodicamente. Notificaremos você sobre 
                quaisquer alterações publicando a nova política nesta página.
              </p>
              
              <h2 className="text-lg font-semibold mt-6 mb-3">8. Contato</h2>
              <p className="text-muted-foreground">
                Para questões sobre privacidade, entre em contato: privacidade@junglegaming.com
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
