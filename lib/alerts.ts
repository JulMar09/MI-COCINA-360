// Fuente única de verdad para las alertas de la cocina.
// El Dashboard y el Centro de alertas usan EXACTAMENTE esta misma lógica.
// No debe existir ninguna otra lógica de alertas en la aplicación.

import { getFoodCostConfig, getFoodCostStatus, FoodCostConfig } from '@/lib/food-cost'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface KitchenAlert {
  // Identificador determinista y estable de la alerta (para poder marcarla
  // como revisada de forma persistente sin depender del orden).
  alertKey: string
  type: string
  severity: AlertSeverity
  title: string
  description: string
  elementId: string
  href: string
  date: string
}

// Reconstruye los costes de receta con la MISMA forma que usa el Dashboard.
export function buildRecipeCosts(allRecipes: any[]): any[] {
  const recipeCosts = (allRecipes ?? []).map((r: any) => {
    const totalCost = (r?.ingredients ?? []).reduce(
      (sum: number, ri: any) => sum + (ri?.quantity ?? 0) * (ri?.ingredient?.costPerUnit ?? 0),
      0
    )
    const costPerPortion = totalCost / Math.max(r?.yield ?? 1, 1)
    const foodCostPct = (r?.sellingPrice ?? 0) > 0
      ? (costPerPortion / r.sellingPrice) * 100
      : 0
    const incompleteIngredients = (r?.ingredients ?? [])
      .filter((ri: any) => (ri?.ingredient?.costPerUnit ?? 0) <= 0)
      .map((ri: any) => ri?.ingredient?.name ?? '')
      .filter((n: string) => n)
    const hasIncompleteCost = incompleteIngredients.length > 0
    return {
      id: r?.id,
      name: r?.name ?? '',
      category: r?.category ?? '',
      yield: r?.yield ?? 1,
      sellingPrice: r?.sellingPrice ?? 0,
      totalCost,
      costPerPortion,
      foodCostPct,
      hasIncompleteCost,
      incompleteIngredients,
    }
  })
  recipeCosts.sort((a: any, b: any) => (b?.totalCost ?? 0) - (a?.totalCost ?? 0))
  return recipeCosts
}

const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 }

export function sortAlerts(alerts: KitchenAlert[]): KitchenAlert[] {
  return [...alerts].sort(
    (a, b) => (severityOrder[a?.severity] ?? 2) - (severityOrder[b?.severity] ?? 2)
  )
}

// Calcula las alertas vivas a partir de los datos reales del sistema.
// allIngredients: ingredientes con supplier.name incluido (opcional)
// recipeCosts: resultado de buildRecipeCosts
// priceHistory: últimos ~20 registros de IngredientPriceHistory (orderBy date desc),
//               con ingredient.name / ingredient.unit incluidos
export function computeAlerts(params: {
  allIngredients: any[]
  recipeCosts: any[]
  priceHistory: any[]
  foodCostConfig: FoodCostConfig
}): KitchenAlert[] {
  const { allIngredients, recipeCosts, priceHistory, foodCostConfig } = params
  const alerts: KitchenAlert[] = []

  // 1. Ingredientes con stock bajo o crítico (usa stock-levels como fuente de verdad)
  for (const ing of (allIngredients ?? [])) {
    const current = ing?.currentStock ?? 0
    const critical = ing?.criticalStock ?? 0
    const min = ing?.minStock ?? 0

    // Nivel crítico: stock ≤ umbral crítico
    if (critical > 0 && current <= critical) {
      alerts.push({
        alertKey: `stock_bajo:${ing?.id}`,
        type: 'stock_bajo',
        severity: 'critical',
        title: `Stock crítico: ${ing?.name ?? ''}`,
        description: `Stock actual: ${current} ${ing?.unit ?? ''} (crítico: ≤${critical}, mínimo: ${min} ${ing?.unit ?? ''})`,
        elementId: ing?.id,
        href: '/inventory',
        date: new Date().toISOString(),
      })
    // Nivel bajo: stock < mínimo pero por encima del crítico
    } else if (min > 0 && current < min) {
      alerts.push({
        alertKey: `stock_bajo:${ing?.id}`,
        type: 'stock_bajo',
        severity: current === 0 ? 'critical' : 'warning',
        title: `Stock bajo: ${ing?.name ?? ''}`,
        description: `Stock actual: ${current} ${ing?.unit ?? ''} (mínimo: ${min} ${ing?.unit ?? ''})`,
        elementId: ing?.id,
        href: '/inventory',
        date: new Date().toISOString(),
      })
    }
  }

  // 2. Food Cost según la configuración de rentabilidad de la cocina
  for (const recipe of (recipeCosts ?? [])) {
    // 2a. Coste incompleto: no se puede afirmar que esté dentro del objetivo.
    if (recipe?.hasIncompleteCost) {
      const missing = recipe?.incompleteIngredients ?? []
      const missingText = missing.length === 1
        ? `El ingrediente ${missing[0]} no tiene un precio registrado.`
        : `${missing.length} ingredientes no tienen precio registrado (${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}).`
      alerts.push({
        alertKey: `food_cost_incompleto:${recipe?.id}`,
        type: 'food_cost_incompleto',
        severity: 'warning',
        title: `Coste incompleto: ${recipe?.name ?? ''}`,
        description: `${missingText} No se puede confirmar el Food Cost.`,
        elementId: recipe?.id,
        href: '/recipes',
        date: new Date().toISOString(),
      })
      continue
    }
    // 2b. Food Cost por encima del objetivo, usando los umbrales de la cocina.
    if ((recipe?.sellingPrice ?? 0) > 0) {
      const status = getFoodCostStatus(recipe?.foodCostPct ?? 0, foodCostConfig)
      if (status === 'atencion' || status === 'critico') {
        const exceedsCritical = (recipe?.foodCostPct ?? 0) > foodCostConfig.critical
        const severity: AlertSeverity = status === 'critico' ? 'critical' : 'warning'
        const gravedad = exceedsCritical ? ' — supera el umbral crítico' : ''
        alerts.push({
          alertKey: `food_cost_alto:${recipe?.id}`,
          type: 'food_cost_alto',
          severity,
          title: `Food Cost ${status === 'critico' ? 'crítico' : 'en atención'}: ${recipe?.name ?? ''}`,
          description: `Food Cost: ${(recipe?.foodCostPct ?? 0).toFixed(1)}% (objetivo: ≤${foodCostConfig.target}%, atención: ≤${foodCostConfig.warning}%, crítico: >${foodCostConfig.warning}%)${gravedad}`,
          elementId: recipe?.id,
          href: '/recipes',
          date: new Date().toISOString(),
        })
      }
    }
  }

  // 3. Cambios de precio significativos (>15% entre los dos últimos precios)
  const priceByIngredient = new Map<string, any[]>()
  for (const ph of (priceHistory ?? [])) {
    const iid = ph?.ingredientId ?? ''
    if (!priceByIngredient.has(iid)) priceByIngredient.set(iid, [])
    priceByIngredient.get(iid)!.push(ph)
  }
  for (const [, history] of priceByIngredient) {
    if (history.length >= 2) {
      const latest = history[0]
      const previous = history[1]
      const oldPrice = previous?.price ?? 0
      const newPrice = latest?.price ?? 0
      if (oldPrice > 0) {
        const variation = ((newPrice - oldPrice) / oldPrice) * 100
        if (Math.abs(variation) > 15) {
          alerts.push({
            alertKey: `cambio_precio:${latest?.id}`,
            type: 'cambio_precio',
            severity: Math.abs(variation) > 30 ? 'critical' : 'warning',
            title: `Cambio de precio: ${latest?.ingredient?.name ?? ''}`,
            description: `${variation > 0 ? '+' : ''}${variation.toFixed(1)}% (de ${oldPrice.toFixed(2)} a ${newPrice.toFixed(2)}€/${latest?.ingredient?.unit ?? ''})`,
            elementId: latest?.ingredientId,
            href: `/ingredients/${latest?.ingredientId}`,
            date: latest?.date,
          })
        }
      }
    }
  }

  // 4. Ingredientes con stock pero sin precio registrado
  for (const ing of (allIngredients ?? [])) {
    if ((ing?.costPerUnit ?? 0) === 0 && (ing?.currentStock ?? 0) > 0) {
      alerts.push({
        alertKey: `sin_precio:${ing?.id}`,
        type: 'sin_precio',
        severity: 'info',
        title: `Sin precio: ${ing?.name ?? ''}`,
        description: `Este ingrediente tiene stock pero no tiene precio registrado`,
        elementId: ing?.id,
        href: `/ingredients/${ing?.id}`,
        date: new Date().toISOString(),
      })
    }
  }

  return sortAlerts(alerts)
}

// Etiquetas legibles por tipo de alerta.
export const ALERT_TYPE_LABELS: Record<string, string> = {
  stock_bajo: 'Stock bajo',
  food_cost_incompleto: 'Coste incompleto',
  food_cost_alto: 'Food Cost elevado',
  cambio_precio: 'Cambio de precio',
  sin_precio: 'Ingrediente sin precio',
}

export function getAlertTypeLabel(type: string): string {
  return ALERT_TYPE_LABELS[type] ?? type
}

// Obtiene las alertas vivas de una cocina consultando los datos reales.
export async function getKitchenAlerts(prisma: any, kitchen: any): Promise<KitchenAlert[]> {
  const kitchenId = kitchen.id
  const foodCostConfig = getFoodCostConfig(kitchen)

  const [allIngredients, allRecipes, priceHistory] = await Promise.all([
    prisma.ingredient.findMany({
      where: { kitchenId },
      include: { supplier: { select: { name: true } } },
    }),
    prisma.recipe.findMany({
      where: { kitchenId },
      include: {
        ingredients: {
          include: { ingredient: { select: { costPerUnit: true, name: true } } },
        },
      },
    }),
    prisma.ingredientPriceHistory.findMany({
      where: { ingredient: { kitchenId } },
      include: { ingredient: { select: { name: true, unit: true } } },
      orderBy: { date: 'desc' },
      take: 20,
    }),
  ])

  const recipeCosts = buildRecipeCosts(allRecipes)
  return computeAlerts({ allIngredients, recipeCosts, priceHistory, foodCostConfig })
}
