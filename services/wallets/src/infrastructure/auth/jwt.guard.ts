import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

// Guard que protege rotas — rejeita requisições sem JWT válido
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}