'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const CATEGORIES = ['Carnes', 'Pescados', 'Verduras', 'Lácteos', 'Especias', 'Aceites', 'Otros']
const UNITS = ['kg', 'g', 'litro', 'ml', 'unidad', 'docena', 'caja']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredient: any
  onSuccess: () => void
}

export function IngredientDialog({ open, onOpenChange, ingredient, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('')
  const [costPerUnit, setCostPerUnit] = useState('')
  const [targetStock, setTargetStock] = useState('')
  const [minStock, setMinStock] = useState('')
  const [criticalStock, setCriticalStock] = useState('')
  const [currentStock, setCurrentStock] = useState('')
  const [notes, setNotes] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/suppliers').then(r => r.json()).then(d => setSuppliers(d ?? [])).catch(() => {})
      if (ingredient) {
        setName(ingredient?.name ?? '')
        setCategory(ingredient?.category ?? '')
        setUnit(ingredient?.unit ?? '')
        setCostPerUnit(String(ingredient?.costPerUnit ?? ''))
        setTargetStock(String(ingredient?.targetStock ?? ''))
        setMinStock(String(ingredient?.minStock ?? ''))
        setCriticalStock(String(ingredient?.criticalStock ?? ''))
        setCurrentStock(String(ingredient?.currentStock ?? ''))
        setNotes(ingredient?.notes ?? '')
        setSupplierId(ingredient?.supplierId ?? '')
      } else {
        setName(''); setCategory(''); setUnit(''); setCostPerUnit(''); setTargetStock(''); setMinStock(''); setCriticalStock(''); setCurrentStock(''); setNotes(''); setSupplierId('')
      }
    }
  }, [open, ingredient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !category || !unit) { toast.error('Completa los campos obligatorios'); return }
    setLoading(true)
    try {
      const body = {
        name, category, unit,
        costPerUnit: parseFloat(costPerUnit) || 0,
        targetStock: parseFloat(targetStock) || 0,
        minStock: parseFloat(minStock) || 0,
        criticalStock: parseFloat(criticalStock) || 0,
        currentStock: parseFloat(currentStock) || 0,
        notes: notes || null,
        supplierId: supplierId || null,
      }
      const url = ingredient ? `/api/ingredients/${ingredient.id}` : '/api/ingredients'
      const method = ingredient ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success(ingredient ? 'Ingrediente actualizado' : 'Ingrediente creado')
        onSuccess()
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Error')
      }
    } catch { toast.error('Error de conexión') } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ingredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Ej: Pechuga de pollo" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unidad *</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u: string) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Coste/Ud (€)</Label>
              <Input type="number" step="0.01" min="0" value={costPerUnit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCostPerUnit(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Stock Actual</Label>
              <Input type="number" step="0.1" min="0" value={currentStock} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentStock(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Niveles de stock</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Objetivo</Label>
                <Input type="number" step="0.1" min="0" value={targetStock} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetStock(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Mínimo</Label>
                <Input type="number" step="0.1" min="0" value={minStock} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinStock(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Crítico</Label>
                <Input type="number" step="0.1" min="0" value={criticalStock} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCriticalStock(e.target.value)} placeholder="0" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Crítico ≤ Mínimo ≤ Objetivo. Si no configuras niveles, el inventario no generará alertas.</p>
          </div>
          <div className="space-y-2">
            <Label>Proveedor</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Sin proveedor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin proveedor</SelectItem>
                {(suppliers ?? []).map((s: any) => <SelectItem key={s?.id} value={s?.id}>{s?.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} placeholder="Notas adicionales..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" loading={loading}>{ingredient ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
