// Taxas padrão da Asaas (sem promoções temporárias, pra não ficar desatualizado).
// Confirme sempre no painel Asaas em "Minha Conta" -> "Taxas" se algo mudou.
const TAXA_PIX_FIXA = 1.99;
const TAXA_CARTAO_PERCENTUAL = 0.0299;
const TAXA_CARTAO_FIXA = 0.49;

export function liquidoPix(valorBruto: number) {
  return Math.max(0, valorBruto - TAXA_PIX_FIXA);
}

export function liquidoCartaoAVista(valorBruto: number) {
  const taxa = valorBruto * TAXA_CARTAO_PERCENTUAL + TAXA_CARTAO_FIXA;
  return Math.max(0, valorBruto - taxa);
}
