export type LoyaltyLevel = 'nova' | 'frequente' | 'fiel';

export type LoyaltyInfo = {
  level: LoyaltyLevel;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  nextLabel?: string;
};

// Critérios:
// Nova       — menos de 3 peças OU menos de R$ 500 gastos
// Frequente  — 3–9 peças E R$ 500–2.499 gastos
// Fiel       — 10+ peças OU R$ 2.500+ gastos
export function getLoyaltyInfo(totalPieces: number, totalSpent: number): LoyaltyInfo {
  if (totalPieces >= 10 || totalSpent >= 2500) {
    return {
      level: 'fiel',
      label: 'Fiel',
      description: '10+ peças ou R$ 2.500+ investidos',
      color: 'text-primary',
      bgColor: 'bg-primary-soft',
    };
  }

  if (totalPieces >= 3 && totalSpent >= 500) {
    const piecesLeft = 10 - totalPieces;
    const valueLeft = 2500 - totalSpent;
    return {
      level: 'frequente',
      label: 'Frequente',
      description: '3–9 peças e R$ 500–2.499 investidos',
      color: 'text-secondary',
      bgColor: 'bg-secondary-soft',
      nextLabel: piecesLeft <= valueLeft / 250
        ? `Faltam ${piecesLeft} peça${piecesLeft !== 1 ? 's' : ''} para Fiel`
        : `Faltam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valueLeft)} para Fiel`,
    };
  }

  const piecesLeft = 3 - totalPieces;
  const valueLeft = 500 - totalSpent;
  return {
    level: 'nova',
    label: 'Nova',
    description: 'Menos de 3 peças ou R$ 500 investidos',
    color: 'text-ink-soft',
    bgColor: 'bg-surface',
    nextLabel: piecesLeft > 0
      ? `Faltam ${piecesLeft} peça${piecesLeft !== 1 ? 's' : ''} para Frequente`
      : `Faltam ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valueLeft)} para Frequente`,
  };
}
