'use client'

import { useState, useEffect } from 'react'
import { useKitchen } from '@/lib/kitchen-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FadeIn } from '@/components/ui/animate'
import { Settings, Building2, Percent, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { DEFAULT_FOOD_COST_CONFIG, validateFoodCostConfig } from '@/lib/food-cost'

const CURRENCIES = [
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'USD', label: '$ Dólar (USD)' },
  { value: 'GBP', label: '£ Libra (GBP)' },
  { value: 'MXN', label: '$ Peso MX (MXN)' },
]

export function SettingsClient() {
  const { kitchen, refresh } = useKitchen()
  const [name, setName] = useState('')
  const [country, setCountry] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [loading, setLoading] = useState(false)

  // Configuración de rentabilidad (Food Cost) — como texto para permitir edición libre
  const [target, setTarget] = useState(String(DEFAULT_FOOD_COST_CONFIG.target))
  const [warning, setWarning] = useState(String(DEFAULT_FOOD_COST_CONFIG.warning))
  const [critical, setCritical] = useState(String(DEFAULT_FOOD_COST_CONFIG.critical))
  const [savingFoodCost, setSavingFoodCost] = useState(false)

  useEffect(() => {
    if (kitchen) {
      setName(kitchen.name ?? '')
      setCountry(kitchen.country ?? '')
      setCurrency(kitchen.currency ?? 'EUR')
      setTarget(String(kitchen.foodCostTarget ?? DEFAULT_FOOD_COST_CONFIG.target))
      setWarning(String(kitchen.foodCostWarning ?? DEFAULT_FOOD_COST_CONFIG.warning))
      setCritical(String(kitchen.foodCostCritical ?? DEFAULT_FOOD_COST_CONFIG.critical))
    }
  }, [kitchen])

  const handleSave = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/kitchens/current', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, country, currency }),
      })
      if (res.ok) {
        toast.success('Configuración guardada')
        refresh()
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? 'Error al guardar')
      }
    } catch { toast.error('Error de conexión') } finally { setLoading(false) }
  }

  const foodCostConfig = {
    target: parseFloat(target),
    warning: parseFloat(warning),
    critical: parseFloat(critical),
  }
  const foodCostError = validateFoodCostConfig(foodCostConfig)

  const handleSaveFoodCost = async () => {
    const validationError = validateFoodCostConfig(foodCostConfig)
    if (validationError) {
      toast.error(validationError)
      return
    }
    setSavingFoodCost(true)
    try {
      const res = await fetch('/api/kitchens/current', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodCostTarget: foodCostConfig.target,
          foodCostWarning: foodCostConfig.warning,
          foodCostCritical: foodCostConfig.critical,
        }),
      })
      if (res.ok) {
        toast.success('Configuración de rentabilidad guardada')
        refresh()
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.error ?? 'Error al guardar')
      }
    } catch { toast.error('Error de conexión') } finally { setSavingFoodCost(false) }
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> Configuración
          </h1>
          <p className="text-muted-foreground mt-1">Ajustes de tu cocina</p>
        </div>
      </FadeIn>
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Datos del Negocio</CardTitle>
            <CardDescription>Modifica los datos de tu cocina</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del Negocio</Label>
              <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>País</Label>
                <Input value={country} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCountry(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c: { value: string; label: string }) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSave} loading={loading}>Guardar Cambios</Button>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Configuración de rentabilidad (Food Cost) */}
      <FadeIn delay={0.15}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Percent className="w-5 h-5" /> Configuración de rentabilidad</CardTitle>
            <CardDescription>
              Define los umbrales de Food Cost de esta cocina. Se utilizan en el panel y en las recetas para
              clasificar el estado (dentro del objetivo, atención o crítico). Estos valores pertenecen a esta cocina.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Food Cost objetivo (%)
                </Label>
                <Input type="number" min="0" max="100" step="0.1" value={target}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTarget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Umbral de atención (%)
                </Label>
                <Input type="number" min="0" max="100" step="0.1" value={warning}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWarning(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Umbral crítico (%)
                </Label>
                <Input type="number" min="0" max="100" step="0.1" value={critical}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCritical(e.target.value)} />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Regla: <span className="font-medium">objetivo &lt; atención &lt; crítico</span>. Valores iniciales por defecto: 30 / 35 / 40 %.
            </div>

            {foodCostError && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{foodCostError}</span>
              </div>
            )}

            <Button onClick={handleSaveFoodCost} loading={savingFoodCost} disabled={!!foodCostError}>
              Guardar configuración de rentabilidad
            </Button>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
