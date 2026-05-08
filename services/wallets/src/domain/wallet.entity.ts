// A entidade é o coração do domínio.
// Ela representa o objeto de negócio (Wallet) e contém
// as regras de negócio puras, sem depender de nenhum framework ou banco de dados.
export class Wallet {
  constructor(
    public readonly id: string,       // Identificador único da carteira
    public readonly userId: string,   // Dono da carteira
    public balance: bigint,           // Saldo atual (BigInt para evitar erros de ponto flutuante com dinheiro)
  ) {}

  // Método de domínio: lógica de negócio de creditar saldo
  // Nenhum controller ou service externo deve manipular balance diretamente
  credit(amount: bigint) {
    this.balance += amount;
  }

  // Método de domínio: lógica de negócio de debitar saldo
  // A regra "não pode debitar mais do que tem" vive AQUI, não no controller
  debit(amount: bigint) {
    if (amount > this.balance) throw new Error("Insufficient balance");
    this.balance -= amount;
  }
}