import { IsNumber, IsPositive, Min } from "class-validator";

export class DepositDto {
  @IsNumber()
  @IsPositive()
  @Min(1, { message: 'Amount must be at least 1' })
  amount: number; // Amount in BRL (e.g., 50.00)
}
