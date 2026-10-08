'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const RECIPE_CATEGORIES = ['Entrantes', 'Principales', 'Postres', 'Bebidas', 'Salsas', 'Otros']

interface RecipeIngredientRow {
  ingredientId: string
  quantity: number
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipe: any
  onSuccess: () => void
}

export function RecipeDialog({ open, onOpenChange, recipe, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [recipeYield, setRecipeYield] = useState('1')
  const [sellingPrice, setSellingPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<RecipeIngredientRow[]>([])
  const [allIngredients, setAllIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/ingredients').then(r => r.json()).then(d => setAllIngredients(d ?? [])).catch(() => {})
      if (recipe) {
        setName(recipe?.name ?? '')
        setCategory(recipe?.category ?? '')
        setRecipeYield(String(recipe?.yield ?? 1))
        setSellingPrice(String(recipe?.sellingPrice ?? ''))
        setNotes(recipe?.notes ?? '')
        setRows((recipe?.ingredients ?? []).map((ri: any) => ({
          ingredientId: ri?.ingredientId ?? ri?.ingredient?.id ?? '',
          quantity: ri?.quantity ?? 0,
        })))
      } else {
        setName(''); setCategory(''); setRecipeYield('1'); setSellingPrice(''); setNotes(''); setRows([])
      }
    }
  }, [open, recipe])

  const addRow = () => setRows([...rows, { ingredientId: '', quantity: 0 }])
  const removeRow = (idx: number) => setRows(rows.filter((_: any, i: number) => i !== idx))
  const updateRow = (idx: number, field: string, value: any) => {
    const updated = [...rows]
    ;(updated[idx] as any)[field] = value
    setRows(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !category) { toast.error('Completa nombre y categoría'); return }
    const validRows = rows.filter((r: RecipeIngredientRow) => r.ingredientId && r.quantity > 0)
    setLoading(true)
    try {
      const body = {
        name, category,
        yield: parseInt(recipeYield) || 1,
        sellingPrice: parseFloat(sellingPrice) || 0,
        notes: notes || null,
        ingredients: validRows,
      }
      const url = recipe ? `/api/recipes/${recipe.id}` : '/api/recipes'
      const method = recipe ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { toast.success(recipe ? 'Receta actualizada' : 'Receta creada'); onSuccess() }
      else { const data = await res.json(); toast.error(data?.error || 'Error') }
    } catch { toast.error('Error de conexión') } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{recipe ? 'Editar Receta' : 'Nueva Receta'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Nombre de la receta" required /></div>
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{RECIPE_CATEGORIES.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Porciones / Raciones</Label><Input type="number" min="1" value={recipeYield} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipeYield(e.target.value)} /></div>
            <div className="space-y-2"><Label>Precio Venta (€)</Label><Input type="number" step="0.01" min="0" value={sellingPrice} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSellingPrice(e.target.value)} placeholder="0.00" /></div>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Ingredientes</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRow}><Plus className="w-4 h-4 mr-1" /> Añadir</Button>
            </div>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin ingredientes. Pulsa "Añadir" para empezar.</p>
            ) : (
              <div className="space-y-2">
                {rows.map((row: RecipeIngredientRow, idx: number) => {
                  const selectedIng = allIngredients.find((i: any) => i?.id === row.ingredientId)
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <Select value={row.ingredientId} onValueChange={(v: string) => updateRow(idx, 'ingredientId', v)}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Ingrediente" /></SelectTrigger>
                        <SelectContent>
                          {(allIngredients ?? []).map((i: any) => <SelectItem key={i?.id} value={i?.id}>{i?.name} ({i?.unit})</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input type="number" step="0.01" min="0" placeholder="Cantidad" className="w-28"
                        value={row.quantity || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateRow(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                      <span className="text-xs text-muted-foreground w-12">{selectedIng?.unit ?? ''}</span>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeRow(idx)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-2"><Label>Notas de Preparación</Label><Textarea value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} placeholder="Instrucciones, notas..." /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" loading={loading}>{recipe ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
