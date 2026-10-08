'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeliveryNoteDialog({ open, onOpenChange, onSuccess }: Props) {
  const [date, setDate] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [ingredientId, setIngredientId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      const today = new Date()
      setDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`)
      setSupplierId(''); setIngredientId(''); setQuantity(''); setUnit(''); setUnitPrice(''); setNotes('')
      Promise.all([
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/ingredients').then(r => r.json()),
      ]).then(([s, i]) => {
        setSuppliers(s ?? [])
        setIngredients(i ?? [])
      }).catch(() => {})
    }
  }, [open])

  // Auto-fill unit and price when ingredient selected
  useEffect(() => {
    if (ingredientId) {
      const ing = ingredients.find((i: any) => i?.id === ingredientId)
      if (ing) {
        setUnit(ing.unit ?? '')
        if (!unitPrice) setUnitPrice(String(ing.costPerUnit ?? ''))
      }
    }
  }, [ingredientId, ingredients, unitPrice])

  const totalPrice = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId || !ingredientId) { toast.error('Selecciona proveedor e ingrediente'); return }
    setLoading(true)
    try {
      const body = {
        date, supplierId, ingredientId,
        quantity: parseFloat(quantity) || 0,
        unit,
        unitPrice: parseFloat(unitPrice) || 0,
        notes: notes || null,
      }
      const res = await fetch('/api/delivery-notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { toast.success('Albarán registrado. Precio y stock actualizados.'); onSuccess() }
      else { const data = await res.json(); toast.error(data?.error || 'Error') }
    } catch { toast.error('Error de conexión') } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nuevo Albarán</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Proveedor *</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
              <SelectContent>{(suppliers ?? []).map((s: any) => <SelectItem key={s?.id} value={s?.id}>{s?.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Producto / Ingrediente *</Label>
            <Select value={ingredientId} onValueChange={setIngredientId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar ingrediente" /></SelectTrigger>
              <SelectContent>{(ingredients ?? []).map((i: any) => <SelectItem key={i?.id} value={i?.id}>{i?.name} ({i?.unit})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input type="number" step="0.01" min="0" value={quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Input value={unit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnit(e.target.value)} placeholder="kg" />
            </div>
            <div className="space-y-2">
              <Label>Precio/Ud (€)</Label>
              <Input type="number" step="0.01" min="0" value={unitPrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUnitPrice(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">Total Albarán</p>
            <p className="text-xl font-mono font-bold">€{totalPrice?.toFixed?.(2) ?? '0.00'}</p>
          </div>
          <div className="space-y-2"><Label>Notas</Label><Textarea value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} placeholder="Observaciones..." /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" loading={loading}>Registrar Albarán</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
