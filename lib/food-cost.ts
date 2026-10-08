// Configuración de rentabilidad / Food Cost por cocina.
// Los umbrales pertenecen a cada cocina; 30/35/40 son SOLO los valores iniciales por defecto.

export interface FoodCostConfig {
  target: number   // Food Cost objetivo (%)
  warning: number  // Umbral de atención (%)
  critical: number // Umbral crítico (%)
}

export const DEFAULT_FOOD_COST_CONFIG: FoodCostConfig = {
  target: 30,
  warning: 35,
  critical: 40,
}

// Extrae la configuración de una cocina, cayendo a los valores por defecto
// únicamente cuando el campo no está definido.
export function getFoodCostConfig(kitchen: any): FoodCostConfig {
  const target = typeof kitchen?.foodCostTarget === 'number' ? kitchen.foodCostTarget : DEFAULT_FOOD_COST_CONFIG.target
  const warning = typeof kitchen?.foodCostWarning === 'number' ? kitchen.foodCostWarning : DEFAULT_FOOD_COST_CONFIG.warning
  const critical = typeof kitchen?.foodCostCritical === 'number' ? kitchen.foodCostCritical : DEFAULT_FOOD_COST_CONFIG.critical
  return { target, warning, critical }
}

export type FoodCostStatus = 'objetivo' | 'atencion' | 'critico' | 'incompleto'

// Estado dinámico según la configuración de la cocina.
// Si el coste está incompleto (algún ingrediente sin precio), nunca se marca
// como "dentro del objetivo" por un Food Cost artificialmente bajo.
export function getFoodCostStatus(
  foodCostPct: number,
  config: FoodCostConfig,
  hasIncompleteCost = false,
): FoodCostStatus {
  if (hasIncompleteCost) return 'incompleto'
  if (foodCostPct <= config.target) return 'objetivo'
  if (foodCostPct <= config.warning) return 'atencion'
  return 'critico'
}

export const FOOD_COST_STATUS_META: Record<
  FoodCostStatus,
  { label: string; emoji: string; text: string; bg: string; badge: string }
> = {
  objetivo: {
    label: 'Dentro del objetivo',
    emoji: '🟢',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  atencion: {
    label: 'Atención',
    emoji: '🟡',
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  critico: {
    label: 'Crítico',
    emoji: '🔴',
    text: 'text-red-600',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-red-700 border-red-200',
  },
  incompleto: {
    label: 'Coste incompleto',
    emoji: '⚠️',
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    badge: 'bg-slate-200 text-slate-700 border-slate-300',
  },
}

// Devuelve un color de texto para el % de Food Cost según la config de la cocina.
export function getFoodCostColor(foodCostPct: number, config: FoodCostConfig): string {
  const status = getFoodCostStatus(foodCostPct, config)
  return FOOD_COST_STATUS_META[status].text
}

// Valida que objetivo < atención < crítico y que estén en rango [0, 100].
export function validateFoodCostConfig(config: FoodCostConfig): string | null {
  const { target, warning, critical } = config
  if ([target, warning, critical].some((v) => typeof v !== 'number' || isNaN(v) || v < 0 || v > 100)) {
    return 'Los valores deben ser números entre 0 y 100.'
  }
  if (!(target < warning && warning < critical)) {
    return 'Debe cumplirse: Food Cost objetivo < Umbral de atención < Umbral crítico.'
  }
  return null
}
