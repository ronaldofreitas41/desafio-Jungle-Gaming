import { Controller, Get, Post } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { WhalletMeResponseDto } from "../dtos/whallet-me-response.dto";

@Controller("wallets")
export class WalletsController {
  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  // Rota para criar uma nova carteira
  @Post()
  create() {
    return {};
  }

  // Rota para obter os detalhes da carteira do usuário atual
  @Get("me")
  getMyWallet(): WhalletMeResponseDto {
    // Implementation for fetching the current user's wallets
    return { id: "wallet-id", balance: 100, createdAt: new Date(), updatedAt: new Date() };
  }

}
