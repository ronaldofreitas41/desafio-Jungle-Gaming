import { Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { GetMyWalletUseCase } from "@/application/get-my-wallet.usecase";
import { CreateWalletUseCase } from "@/application/create-wallet.usecase";
import { WalletMeResponseDto } from "../dtos/wallet-me-response.dto";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { JwtAuthGuard } from "@/infrastructure/auth/jwt.guard";

// O Controller é a porta de entrada HTTP.

@Controller("wallets")
export class WalletController {
  // Injeta os use cases, não o repository diretamente.
  // O controller não sabe como os dados são buscados ou salvos.
  constructor(
    private readonly getMyWallet: GetMyWalletUseCase,
    private readonly createWallet: CreateWalletUseCase,
  ) { }

  // POST /wallet — cria uma nova carteira para o usuário autenticado
  //Autenticação é feita por meio do JwtAuthGuard, que verifica se o token JWT é válido. Se não for, a requisição é rejeitada com 401 Unauthorized.
  @Post()
  @UseGuards(JwtAuthGuard) // Protege o endpoint de saúde com autenticação
  async create(@Req() req: any) {
    // req.user.id vem do seu guard de autenticação (JWT, session, etc.)
    const wallet = await this.createWallet.execute(req.user.id);

    // Retorna apenas o id — não expõe dados desnecessários
    return { id: wallet.id };
  }

  // GET /wallet/me — retorna a carteira do usuário autenticado
  //Autenticação é feita por meio do JwtAuthGuard, que verifica se o token JWT é válido. Se não for, a requisição é rejeitada com 401 Unauthorized.

  @Get("me")
  @UseGuards(JwtAuthGuard) // Protege o endpoint de saúde com autenticação
  async getMe(@Req() req: any): Promise<WalletMeResponseDto> {
    const wallet = await this.getMyWallet.execute(req.user.id);

    // Mapeia a entidade para o DTO de resposta
    // O DTO controla exatamente o que é exposto na API
    return { id: wallet.id, balance: wallet.balance.toString() };
  }

  // GET /wallet/health — endpoint de saúde para monitoramento se a API está rodando
  //Autenticação é feita por meio do JwtAuthGuard, que verifica se o token JWT é válido. Se não for, a requisição é rejeitada com 401 Unauthorized.

  @Get("health")
  @UseGuards(JwtAuthGuard)
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }
}


