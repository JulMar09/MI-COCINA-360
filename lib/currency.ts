const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  MXN: '$',
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? '€'
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const symbol = getCurrencySymbol(currency)
  return `${symbol}${amount?.toFixed?.(2) ?? '0.00'}`
}
