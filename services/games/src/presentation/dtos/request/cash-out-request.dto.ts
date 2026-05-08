import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class CashOutRequestDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1.0)
  multiplier: number;
}
