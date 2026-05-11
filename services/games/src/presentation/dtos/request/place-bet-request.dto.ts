import { IsNotEmpty, IsNumber, IsInt, Min } from "class-validator";

export class PlaceBetRequestDto {
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  @Min(100)
  amount: number; // Centavos (ex.: 100 = R$1,00), mesmo formato do saldo da carteira
}
