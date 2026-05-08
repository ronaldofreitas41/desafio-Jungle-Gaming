import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extrai o token do header: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // Não rejeita tokens expirados aqui — o Keycloak trata disso
      ignoreExpiration: false,
      
      // URL pública do Keycloak para validar a assinatura do JWT
      // O JWKS é o conjunto de chaves públicas do Keycloak
      secretOrKeyProvider: async (_req: any, rawJwtToken: any, done: any) => {
        const jwksUri = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`;
        const jwksClient = (await import("jwks-rsa")).default({
          jwksUri,
          cache: true,
        });
        
        const decoded = JSON.parse(
          Buffer.from(rawJwtToken.split(".")[0], "base64").toString()
        );
        
        const key = await jwksClient.getSigningKey(decoded.kid);
        done(null, key.getPublicKey());
      },
    });
  }

  // O que é extraído do JWT e colocado no req.user
  validate(payload: any) {
    return {
      id: payload.sub,        // ID do utilizador no Keycloak
      email: payload.email,
      username: payload.preferred_username,
    };
  }
}