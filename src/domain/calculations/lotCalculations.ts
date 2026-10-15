export function formatQuantity(quantityKg: number): string {
  if (quantityKg >= 1000) {
    const tons = quantityKg / 1000;
    // Format to 1 decimal place if fractional, else integer
    const formatted = tons % 1 === 0 ? tons.toFixed(0) : tons.toFixed(1);
    return `${formatted} t (${quantityKg.toLocaleString()} kg)`;
  }
  return `${quantityKg.toLocaleString()} kg`;
}

export function formatRwf(amount: number): string {
  const rounded = Math.round(amount);
  return `${rounded.toLocaleString()} RWF`;
}

export function calculateRemainingQuantity(
  totalKg: number,
  reservedKg: number,
  soldKg: number
): number {
  const remaining = totalKg - reservedKg - soldKg;
  return Math.max(0, remaining);
}

export function canReserveQuantity(availableKg: number, requestedKg: number): boolean {
  return requestedKg > 0 && availableKg >= requestedKg;
}
