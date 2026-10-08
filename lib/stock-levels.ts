// Lógica centralizada de niveles de stock para el inventario profesional.
// Usada por el inventario, alertas y la futura lista de compras.

export type StockLevel = 'critico' | 'bajo' | 'normal' | 'optimo' | 'sin_configurar'

export interface StockLevelInfo {
  level: StockLevel
  label: string
  color: string          // Tailwind class for badge bg + text
  borderColor: string    // Tailwind class for row highlight
  icon: 'critical' | 'warning' | 'ok' | 'optimal' | 'none'
}

export interface StockAnalysis {
  levelInfo: StockLevelInfo
  suggestedPurchase: number  // max(0, targetStock - currentStock)
  percentOfTarget: number    // 0-100+, percentage of target stock filled
}

const LEVEL_META: Record<StockLevel, Omit<StockLevelInfo, 'level'>> = {
  critico: {
    label: 'Crítico',
    color: 'bg-red-100 text-red-700 border-red-200',
    borderColor: 'bg-red-50/50',
    icon: 'critical',
  },
  bajo: {
    label: 'Bajo',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    borderColor: 'bg-amber-50/50',
    icon: 'warning',
  },
  normal: {
    label: 'Normal',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    borderColor: '',
    icon: 'ok',
  },
  optimo: {
    label: 'Óptimo',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    borderColor: '',
    icon: 'optimal',
  },
  sin_configurar: {
    label: 'Sin configurar',
    color: 'bg-gray-100 text-gray-500 border-gray-200',
    borderColor: '',
    icon: 'none',
  },
}

/**
 * Determina el nivel de stock de un ingrediente.
 * Orden de prioridad: crítico > bajo > normal > óptimo.
 * Si no hay ningún umbral configurado (todos en 0), devuelve 'sin_configurar'.
 */
export function getStockLevel(ingredient: {
  currentStock: number
  criticalStock: number
  minStock: number
  targetStock: number
}): StockLevel {
  const current = ingredient.currentStock ?? 0
  const critical = ingredient.criticalStock ?? 0
  const min = ingredient.minStock ?? 0
  const target = ingredient.targetStock ?? 0

  // Si no hay ningún umbral configurado
  if (critical === 0 && min === 0 && target === 0) return 'sin_configurar'

  // Nivel crítico: stock ≤ umbral crítico (si está configurado)
  if (critical > 0 && current <= critical) return 'critico'

  // Nivel bajo: stock < mínimo (si está configurado)
  if (min > 0 && current < min) return 'bajo'

  // Nivel óptimo: stock ≥ objetivo (si está configurado)
  if (target > 0 && current >= target) return 'optimo'

  // Normal: entre mínimo y objetivo, o por encima de mínimo sin objetivo
  return 'normal'
}

export function getStockLevelInfo(level: StockLevel): StockLevelInfo {
  return { level, ...LEVEL_META[level] }
}

export function analyzeStock(ingredient: {
  currentStock: number
  criticalStock: number
  minStock: number
  targetStock: number
}): StockAnalysis {
  const level = getStockLevel(ingredient)
  const levelInfo = getStockLevelInfo(level)
  const current = ingredient.currentStock ?? 0
  const target = ingredient.targetStock ?? 0

  const suggestedPurchase = target > 0 ? Math.max(0, target - current) : 0
  const percentOfTarget = target > 0 ? Math.round((current / target) * 100) : 0

  return { levelInfo, suggestedPurchase, percentOfTarget }
}
