export function formatXof(amount: number) {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
}
