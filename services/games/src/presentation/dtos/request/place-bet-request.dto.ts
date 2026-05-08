import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class PlaceBetRequestDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number; // Valor em dinheiro (será convertido para bigint centavos)
}
