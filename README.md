# 🎮 Crash Game — Documentação Técnica
### Desafio Jungle Gaming

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [DDD — Domain Driven Design](#3-ddd--domain-driven-design)
4. [Wallet Service](#4-wallet-service--decisões-técnicas)
5. [Game Service](#5-game-service--motor-do-jogo)
6. [Autenticação com Keycloak](#6-autenticação-com-keycloak--jwt)
7. [Comunicação via RabbitMQ](#7-comunicação-via-rabbitmq)
8. [Infraestrutura e Setup](#8-infraestrutura-e-setup)
9. [Prisma 7 — Mudanças Importantes](#9-prisma-7--mudanças-importantes)
10. [Frontend — Next.js](#10-frontend--nextjs)
11. [Estrutura de Pastas](#12-estrutura-de-pastas)
12. [Referência da API](#13-referência-da-api)
13. [Testes](#14-testes)

---

## 1. Visão Geral

O **Crash Game** é um jogo de cassino multiplayer em tempo real. Um multiplicador sobe continuamente a partir de `1.00x` e pode "crashar" a qualquer momento. O jogador aposta antes da rodada e precisa sacar antes do crash para lucrar — caso contrário, perde a aposta.

O sistema é dividido em **dois microserviços independentes**:

- **Game Service (porta 4001)** — Engine do jogo, rodadas, apostas, WebSocket, Provably Fair
- **Wallet Service (porta 4002)** — Carteira do jogador, saldo, crédito e débito

---

## 2. Arquitetura do Sistema

O sistema usa uma arquitetura de microserviços com comunicação assíncrona via RabbitMQ. O Kong atua como API Gateway, roteando todas as requisições para os serviços corretos.

```
                        ┌──────────────────────────┐
                        │        Frontend           │
                        │      (Next.js 15)         │
                        └─────┬────────────┬────────┘
                           HTTP/REST    WebSocket
                              │            │
                        ┌─────▼────────────▼────────┐
                        │         Kong               │
                        │      (API Gateway)         │
                        └─────┬────────────┬────────┘
                              │            │
                    ┌─────────▼──┐   ┌─────▼────────┐
                    │   Game     │   │   Wallet     │
                    │  Service   │   │   Service    │
                    │  (NestJS)  │   │   (NestJS)   │
                    └──┬─────┬──┘   └──────┬───────┘
                       │     └──────┬──────┘
                  ┌────▼────┐  ┌────▼──────────┐
                  │PostgreSQL│  │   RabbitMQ    │
                  └─────────┘  └───────────────┘
              ┌─────────────────┐
              │    Keycloak     │
              │  (IdP — OIDC)   │
              └─────────────────┘
```

### Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Runtime | Bun (latest) |
| Backend | NestJS + TypeScript (strict mode) |
| Banco | PostgreSQL 18 com Prisma 7 |
| Mensageria | RabbitMQ |
| API Gateway | Kong |
| IdP | Keycloak (OIDC) |
| WebSocket | @nestjs/websockets + socket.io |
| Frontend | Next.js 15 (App Router) |
| Estilo | Tailwind CSS + shadcn/ui |
| Estado | Zustand |
| Infra | Docker Compose |

### Serviços e Portas

| Componente | Responsabilidade | Porta |
|---|---|---|
| Frontend (Next.js) | Interface do utilizador, WebSocket client | 3000 |
| Kong (API Gateway) | Roteamento, autenticação, rate limiting | 8000 |
| Game Service | Engine do jogo, rodadas, apostas, WebSocket | 4001 |
| Wallet Service | Carteira, saldo, crédito/débito | 4002 |
| PostgreSQL | Persistência de dados (2 bancos separados) | 5432 |
| RabbitMQ | Mensageria assíncrona entre serviços | 5672 |
| Keycloak | Autenticação OIDC, gestão de utilizadores | 8080 |

> **Por que dois bancos de dados separados?**
> Cada serviço tem o seu próprio banco (`games` e `wallets`). Isso é o princípio de isolamento de dados em microserviços — cada serviço é o único dono dos seus dados. Evita acoplamento entre serviços e permite escalar cada um independentemente.

---

## 3. DDD — Domain Driven Design

O projeto segue **DDD (Domain Driven Design)** com separação em 4 camadas. Esta é a escolha arquitetural mais importante do projeto.

### As 4 Camadas

| Camada | Responsabilidade | O que contém |
|---|---|---|
| `domain/` | Coração do negócio | Entidades, repositórios abstratos, regras de negócio |
| `application/` | Orquestração de casos de uso | Use cases, serviços de aplicação |
| `infrastructure/` | Detalhes técnicos | Prisma, RabbitMQ, JWT strategy |
| `presentation/` | Interface com o mundo exterior | Controllers HTTP, DTOs, WebSocket gateway |

### Por que DDD?

- **Separação de responsabilidades** — cada camada tem uma única função
- **Testabilidade** — o domínio não depende de nenhuma biblioteca externa
- **Flexibilidade** — pode trocar o Prisma por outro ORM sem tocar no domínio
- **Inversão de dependência** — o domínio define contratos, a infraestrutura implementa

### Fluxo de uma Requisição HTTP

Quando o frontend faz `POST /wallets`, o fluxo percorre todas as camadas:

| Passo | Camada | O que acontece |
|---|---|---|
| 1 | Presentation | `WalletController` recebe o HTTP request, extrai `req.user.id` do JWT |
| 2 | Application | `CreateWalletUseCase` verifica se já existe carteira (regra de negócio) |
| 3 | Domain | Cria entidade `Wallet` com ID único e `balance = 0n` (BigInt) |
| 4 | Infrastructure | `PrismaWalletRepository` persiste no banco PostgreSQL |
| 5 | Presentation | Controller retorna DTO com `{ id }` — nunca expõe a entidade diretamente |

### Princípio da Inversão de Dependência (DIP)

```
Domain (abstrato)          Infrastructure (concreto)
─────────────────          ──────────────────────────
WalletRepository  ◄────── PrismaWalletRepository
     (contrato)                (implementação)
```

No `WalletModule`, o NestJS faz o binding:
```typescript
{ provide: WalletRepository, useClass: PrismaWalletRepository }
```

Se amanhã quiseres trocar o Prisma por TypeORM, só crias uma nova implementação — o domínio e os use cases não mudam nada.

---

## 4. Wallet Service — Decisões Técnicas

### 4.1 Por que BigInt para o saldo?

O saldo é armazenado em **centavos inteiros como BigInt**. Esta decisão evita erros de precisão de ponto flutuante.

**O problema com float:**
```javascript
0.1 + 0.2 = 0.30000000000000004  // ERRADO em JavaScript!
```

**A solução com BigInt (centavos):**
```javascript
// R$ 10,00 = 1000n (1000 centavos — sem erro de precisão)
balance = 1000n

// Crédito
balance += 500n  // R$ 5,00 → balance = 1500n

// Débito com validação
if (amount > balance) throw new Error("Saldo insuficiente")
balance -= amount
```

**Por que converter para string na API?**
O `JSON.stringify` nativo do JavaScript não suporta `BigInt` — lança `TypeError`. A solução é converter para `string` na saída da API (no DTO), mantendo `BigInt` em todo o processamento interno.

```typescript
// DTO de resposta
return { id: wallet.id, balance: wallet.balance.toString() }
```

### 4.2 Repositório Abstrato

```typescript
// Domain — define o CONTRATO
export abstract class WalletRepository {
  abstract findByUserId(userId: string): Promise<Wallet | null>
  abstract create(wallet: Wallet): Promise<Wallet>
  abstract save(wallet: Wallet): Promise<Wallet>
}

// Infrastructure — fornece a IMPLEMENTAÇÃO
@Injectable()
export class PrismaWalletRepository implements WalletRepository {
  async findByUserId(userId: string): Promise<Wallet | null> {
    const row = await this.prisma.wallet.findUnique({ where: { userId } })
    if (!row) return null
    // Converte o objeto do Prisma para a entidade do domínio
    return new Wallet(row.id, row.userId, row.balance)
  }
  // ...
}
```

### 4.3 PrismaService

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL
      })
    })
  }

  async onModuleInit() {
    await this.$connect()
  }
}
```

> O `PrismaService` estende o `PrismaClient` e implementa `OnModuleInit` do NestJS. Isso garante que a conexão com o banco é estabelecida quando o módulo inicia. O adapter `PrismaPg` é necessário no Prisma 7 para passar a URL de conexão em runtime.

---

## 5. Game Service — Motor do Jogo

### 5.1 Ciclo de Vida de uma Rodada

| Estado | Duração | O que acontece |
|---|---|---|
| `BETTING` | ~10 segundos | Jogadores podem apostar. Hash da seed exibida no frontend. |
| `RUNNING` | Variável | Multiplicador sobe. Jogadores podem sacar. Engine emite ticks via WebSocket. |
| `CRASHED` | Instantâneo | Multiplicador para no crash point. Quem não sacou perde. |

### 5.2 Algoritmo Provably Fair

O Provably Fair garante que o crash point foi determinado antes das apostas e não pode ser manipulado. O algoritmo usa HMAC-SHA256 com hash chains:

1. **Seed** — valor aleatório gerado antes de cada rodada
2. **Hash** — SHA256 da seed, exibida ao jogador **antes** da rodada
3. **Crash Point** — calculado a partir da seed com HMAC-SHA256
4. **Verificação** — após a rodada, a seed é revelada e qualquer um pode recalcular

**Por que o jogador confia?**
A hash é exibida antes da rodada. Como SHA256 é unidirecional, é impossível manipular o crash point depois de revelar a hash.

```
Antes da rodada:  hash = SHA256(seed)  → exibido ao jogador
Durante a rodada: crashPoint = HMAC(seed, ...)  → secreto
Após a rodada:    seed revelada → jogador verifica SHA256(seed) == hash
```

### 5.3 WebSocket Events

| Evento | Direção | Payload | Quando é emitido |
|---|---|---|---|
| `round:start` | Server→Client | `roundId, hash, bettingEndsAt` | Nova fase de apostas inicia |
| `betting:end` | Server→Client | — | Fase de apostas termina |
| `multiplier:tick` | Server→Client | `multiplier: number` | A cada tick durante RUNNING |
| `round:crash` | Server→Client | `roundId, crashPoint, seed` | Rodada crasha |
| `bet:placed` | Server→Client | `betId, playerId, amount` | Aposta confirmada |
| `bet:cashout` | Server→Client | `betId, multiplier, profit` | Jogador saca |

---

## 6. Autenticação com Keycloak + JWT

A autenticação usa o fluxo **OIDC Authorization Code com PKCE**. O Keycloak é o Identity Provider (IdP) que emite os tokens JWT.

### Fluxo Completo

| Passo | Descrição |
|---|---|
| 1. Login | Frontend redireciona para Keycloak (`http://localhost:8080`) |
| 2. Autenticação | Utilizador insere credenciais no Keycloak (`player` / `player123`) |
| 3. Callback | Keycloak redireciona com `code` para o frontend |
| 4. Token Exchange | Frontend troca o `code` por `access_token` JWT |
| 5. API Request | Frontend envia JWT no header: `Authorization: Bearer <token>` |
| 6. Validação | `JwtStrategy` valida assinatura usando JWKS do Keycloak |
| 7. req.user | Payload do JWT é extraído e colocado em `req.user` |

### JwtStrategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: async (_req, rawJwtToken, done) => {
        // Busca a chave pública do Keycloak via JWKS
        const jwksUri = `${KEYCLOAK_URL}/realms/crash-game/protocol/openid-connect/certs`
        // ...
      }
    })
  }

  validate(payload: any) {
    return {
      id: payload.sub,                    // ID do utilizador
      email: payload.email,
      username: payload.preferred_username
    }
  }
}
```

> A `JwtStrategy` usa passport-jwt e valida o token usando o **JWKS público do Keycloak**. O backend nunca precisa do secret — usa a chave pública para verificar a assinatura.

### Proteger uma Rota

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)  // ← protege a rota
async getMe(@Req() req: any) {
  // req.user.id vem do JWT validado
  return this.getMyWallet.execute(req.user.id)
}
```

---

## 7. Comunicação via RabbitMQ

Game Service e Wallet Service comunicam-se de forma **assíncrona via RabbitMQ**. Isso mantém os serviços desacoplados.

### Eventos de Mensageria

| Evento | Producer | Consumer | O que acontece |
|---|---|---|---|
| `wallet.debit` | Game Service | Wallet Service | Debita o valor da aposta da carteira |
| `wallet.credit` | Game Service | Wallet Service | Credita o ganho após cashout |
| `wallet.refund` | Game Service | Wallet Service | Reembolso em caso de erro |

### Por que assíncrono e não REST direto?

- **Resiliência** — se o Wallet Service cair, a mensagem fica em fila e é processada quando recuperar
- **Desacoplamento** — Game Service não conhece o Wallet Service diretamente
- **Padrão Saga** — facilita implementar compensação de transações distribuídas
- **Escalabilidade** — cada serviço escala independentemente

```
Game Service                 RabbitMQ              Wallet Service
─────────────                ────────              ──────────────
aposta recebida  ──publish──► wallet_queue ──consume──► debita saldo
cashout          ──publish──► wallet_queue ──consume──► credita saldo
```

---

## 8. Infraestrutura e Setup

### Pré-requisitos

- Bun >= 1.x instalado
- Docker Desktop instalado e em execução

### Como Executar

```bash
# 1. Clonar o repositório
git clone https://github.com/ronaldofreitas41/desafio-Jungle-Gaming

# 2. Entrar na pasta
cd desafio-Jungle-Gaming

# 3. Subir tudo (migrations + seed incluídos automaticamente)
bun run docker:up

# 4. Parar os containers
bun run docker:down

# 5. Remover tudo (containers, volumes, imagens)
bun run docker:prune
```

### URLs de Acesso

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API (via Kong) | http://localhost:8000 |
| Game Service (direto) | http://localhost:4001 |
| Wallet Service (direto) | http://localhost:4002 |
| Keycloak Admin | http://localhost:8080 (admin/admin) |
| RabbitMQ UI | http://localhost:15672 (admin/admin) |
| Swagger Games | http://localhost:4001/docs |
| Swagger Wallets | http://localhost:4002/docs |

### Utilizador de Teste

| Campo | Valor |
|---|---|
| Username | `player` |
| Password | `player123` |
| Saldo inicial | R$ 1.000,00 (100.000 centavos) |

### Variáveis de Ambiente

**`services/wallets/.env`**
```env
PORT=4002
DATABASE_URL=postgresql://admin:admin@postgres:5432/wallets
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=crash-game
```

**`services/games/.env`**
```env
PORT=4001
DATABASE_URL=postgresql://admin:admin@postgres:5432/games
RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=crash-game
```

### Dockerfile — Estratégia de Build

```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .
RUN bunx prisma generate

RUN chmod +x entrypoint.sh
EXPOSE 4002
ENTRYPOINT ["./entrypoint.sh"]
```

**`entrypoint.sh`**
```bash
#!/bin/sh
set -e

echo "Aplicando migrations..."
bunx prisma migrate deploy

echo "Iniciando serviço..."
exec bun run src/main.ts
```

> O `migrate deploy` aplica migrations pendentes sem pedir confirmação — é o comando correto para produção/CI.

---

## 9. Prisma 7 — Mudanças Importantes

O Prisma 7 introduziu mudanças significativas em relação às versões anteriores.

| O que mudou | Antes (Prisma 6) | Agora (Prisma 7) |
|---|---|---|
| Configuração | `datasource` no `schema.prisma` | `prisma.config.ts` separado |
| Import do Client | `@prisma/client` | Client gerado localmente em `src/generated/client` |
| URL de conexão | No `schema.prisma` | No `prisma.config.ts` ou via adapter no `PrismaService` |
| Adapter | Opcional | Obrigatório para passar URL em runtime (`PrismaPg`) |

### schema.prisma (Prisma 7)

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/client"  // gerado dentro de src/
}

datasource db {
  provider = "postgresql"
  // URL vem do prisma.config.ts ou do adapter em runtime
}
```

### prisma.config.ts

```typescript
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://admin:admin@localhost:5432/wallets"
  }
})
```

> **Por que o output aponta para `src/generated/client`?** Porque o Dockerfile copia a pasta `src/` para o container. Se o client fosse gerado fora de `src/`, não seria incluído no build Docker.

---

## 10. Frontend — Next.js

### Stack

| Tecnologia | Uso |
|---|---|
| Next.js 15 (App Router) | Framework React com SSR, roteamento por pasta |
| Tailwind CSS | Estilização utility-first, dark mode nativo |
| shadcn/ui | Componentes UI acessíveis e customizáveis |
| Zustand | Estado global (utilizador, carteira, rodada atual, apostas) |
| Socket.io Client | WebSocket para eventos em tempo real do Game Service |

### Fluxo de Autenticação

1. Utilizador clica em Login → redireciona para Keycloak
2. Keycloak autentica e redireciona para `/auth/callback?code=...`
3. `authService.handleCallback()` troca o `code` por tokens
4. Token é guardado no Zustand store
5. `apiService.setAccessToken()` passa o JWT para todas as chamadas API
6. `useWebSocket()` conecta ao WebSocket com o token

### WebSocket Service

```typescript
class WebSocketService {
  connect(token?: string) {
    this.socket = io(WS_URL, {
      path: '/games/socket.io',
      auth: token ? { token } : undefined,
    })

    // Propaga eventos para os listeners
    this.socket.on('round:start', (data) => this.emit('round:start', data))
    this.socket.on('multiplier:tick', (data) => this.emit('multiplier:tick', data))
    this.socket.on('round:crash', (data) => this.emit('round:crash', data))
    // ...
  }
}
```

## 11. Estrutura de Pastas

```
desafio-Jungle-Gaming/
├── services/
│   ├── games/                    # Game Service (NestJS)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── game.module.ts
│   │   │   ├── domain/
│   │   │   │   ├── round.entity.ts       # Entidade Round com estados e regras
│   │   │   │   ├── bet.entity.ts         # Entidade Bet
│   │   │   │   └── round.repository.ts   # Contrato abstrato do repositório
│   │   │   ├── application/
│   │   │   │   ├── place-bet.usecase.ts  # Caso de uso: fazer aposta
│   │   │   │   ├── cash-out.usecase.ts   # Caso de uso: sacar
│   │   │   │   └── services/
│   │   │   │       └── game-engine.service.ts  # Motor do jogo
│   │   │   ├── infrastructure/
│   │   │   │   ├── prisma.service.ts
│   │   │   │   ├── prisma.module.ts
│   │   │   │   ├── prisma-round.repository.ts
│   │   │   │   └── auth/
│   │   │   │       ├── jwt.guard.ts
│   │   │   │       └── jwt.strategy.ts
│   │   │   └── presentation/
│   │   │       ├── controllers/
│   │   │       │   └── games.controller.ts
│   │   │       └── gateways/
│   │   │           └── game.gateway.ts    # WebSocket gateway
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   └── e2e/
│   │   ├── Dockerfile
│   │   ├── entrypoint.sh
│   │   └── package.json
│   │
│   └── wallets/                  # Wallet Service (NestJS)
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── wallet.module.ts
│       │   ├── domain/
│       │   │   ├── wallet.entity.ts      # Entidade Wallet (BigInt balance)
│       │   │   └── wallet.repository.ts  # Contrato abstrato
│       │   ├── application/
│       │   │   ├── create-wallet.usecase.ts
│       │   │   ├── get-my-wallet.usecase.ts
│       │   │   ├── credit-wallet.usecase.ts
│       │   │   └── debit-wallet.usecase.ts
│       │   ├── infrastructure/
│       │   │   ├── prisma.service.ts
│       │   │   ├── prisma.module.ts
│       │   │   ├── prisma-wallet.repository.ts
│       │   │   └── auth/
│       │   │       ├── jwt.guard.ts
│       │   │       └── jwt.strategy.ts
│       │   ├── generated/
│       │   │   └── client/               # Prisma Client gerado
│       │   └── presentation/
│       │       ├── controllers/
│       │       │   ├── wallets.controller.ts
│       │       │   └── wallet-message.controller.ts  # RabbitMQ listener
│       │       └── dtos/
│       │           └── wallet-me-response.dto.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── prisma.config.ts
│       │   └── migrations/
│       ├── tests/
│       │   ├── unit/
│       │   └── e2e/
│       ├── Dockerfile
│       ├── entrypoint.sh
│       └── package.json
│
├── frontend/                     # Next.js App
│   └── src/
│       ├── app/                  # App Router (páginas)
│       │   ├── page.tsx          # Página principal do jogo
│       │   └── auth/callback/    # Callback do Keycloak
│       ├── components/
│       │   └── game/
│       │       ├── crash-graph.tsx    # Gráfico animado do multiplicador
│       │       ├── betting-controls.tsx
│       │       └── live-bets.tsx
│       ├── services/
│       │   ├── api.ts            # ApiService (REST)
│       │   ├── websocket.ts      # WebSocketService (socket.io)
│       │   └── auth.ts           # AuthService (Keycloak OIDC)
│       └── stores/
│           └── game-store.ts     # Zustand store
│
├── docker/
│   ├── kong/kong.yml             # Configuração declarativa do Kong
│   ├── keycloak/realm-export.json  # Realm crash-game pré-configurado
│   └── postgres/init-databases.sh  # Cria os bancos games e wallets
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 12. Referência da API

Todos os endpoints são acedidos via Kong em `http://localhost:8000`

### Wallet Service

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/wallets/health` | Não | Health check do serviço |
| `POST` | `/wallets` | Sim (JWT) | Cria carteira para o utilizador autenticado |
| `GET` | `/wallets/me` | Sim (JWT) | Retorna `{ id, balance }` da carteira |

**Exemplo de resposta GET /wallets/me:**
```json
{
  "id": "wallet-uuid",
  "balance": "100000"
}
```
> `balance` é string em centavos. R$ 1.000,00 = `"100000"`

### Game Service

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| `GET` | `/games/health` | Não | Health check do serviço |
| `GET` | `/games/rounds/current` | Não | Estado da rodada atual com apostas |
| `GET` | `/games/rounds/history` | Não | Histórico paginado de rodadas |
| `GET` | `/games/rounds/:roundId/verify` | Não | Dados de verificação Provably Fair |
| `GET` | `/games/bets/me` | Sim (JWT) | Histórico de apostas do utilizador (paginado) |
| `POST` | `/games/bet` | Sim (JWT) | Fazer aposta na rodada atual |
| `POST` | `/games/bet/cashout` | Sim (JWT) | Sacar no multiplicador atual |

**Exemplo POST /games/bet:**
```json
// Request
{ "amount": 1000 }  // R$ 10,00 em centavos

// Response
{
  "id": "bet-uuid",
  "roundId": "round-uuid",
  "playerId": "user-uuid",
  "amount": "1000",
  "status": "pending"
}
```

### Documentação Swagger

- Game Service: http://localhost:4001/docs
- Wallet Service: http://localhost:4002/docs

---

## 13. Testes

### Comandos

```bash
# Testes unitários — Wallet Service
cd services/wallets 
bun test tests/unit

# Testes unitários — Game Service
cd services/games
bun test tests/unit

# Testes E2E — Wallet Service (requer docker:up)
cd services/wallets 
bun test tests/e2e

# Testes E2E — Game Service (requer docker:up)
cd services/games
bun test tests/e2e
```

### O que é testado nos testes unitários

**Wallet Service:**
- Crédito de saldo
- Débito de saldo
- Erro ao debitar mais do que o saldo disponível
- Precisão de BigInt em operações monetárias

**Game Service:**
- Ciclo de vida do Round (transições de estado)
- Violação de invariantes (ex: crashar sem estar em RUNNING)
- Cálculo de cashout da Bet
- Validação de valor mínimo/máximo da aposta
- Cálculo determinístico do crash point (Provably Fair)
- Verificação da hash chain

---

*Desafio Jungle Gaming — Ronaldo Freitas*