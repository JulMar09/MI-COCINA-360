'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useKitchen } from '@/lib/kitchen-context'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Pencil, Trash2, Carrot, Eye } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { IngredientDialog } from './ingredient-dialog'

export function IngredientsClient() {
  const { kitchen } = useKitchen()
  const searchParams = useSearchParams()
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/ingredients')
      if (res.ok) setIngredients(await res.json())
    } catch { console.error('Failed') } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (searchParams?.get('action') === 'new') setDialogOpen(true)
  }, [searchParams])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este ingrediente?')) return
    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Ingrediente eliminado')
        fetchData()
      } else {
        toast.error('Error al eliminar')
      }
    } catch { toast.error('Error de conexión') }
  }

  const filtered = (ingredients ?? []).filter((i: any) =>
    (i?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i?.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const currency = kitchen?.currency ?? 'EUR'

  const CATEGORY_COLORS: Record<string, string> = {
    Carnes: 'bg-red-100 text-red-700',
    Pescados: 'bg-blue-100 text-blue-700',
    Verduras: 'bg-green-100 text-green-700',
    'Lácteos': 'bg-yellow-100 text-yellow-700',
    Especias: 'bg-orange-100 text-orange-700',
    Aceites: 'bg-amber-100 text-amber-700',
    Otros: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
              <Carrot className="w-6 h-6 text-primary" />
              Ingredientes
            </h1>
            <p className="text-muted-foreground mt-1">Gestiona los ingredientes de tu cocina</p>
          </div>
          <Button onClick={() => { setEditItem(null); setDialogOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Ingrediente
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ingredientes..."
            className="pl-10"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {search ? 'Sin resultados' : 'No hay ingredientes. ¡Añade el primero!'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-right">Coste/Ud</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((ing: any) => (
                      <TableRow key={ing?.id}>
                        <TableCell className="font-medium">
                          <Link href={`/ingredients/${ing?.id}`} className="text-primary hover:underline">
                            {ing?.name ?? ''}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge className={CATEGORY_COLORS[ing?.category ?? ''] ?? 'bg-gray-100 text-gray-700'} variant="secondary">
                            {ing?.category ?? ''}
                          </Badge>
                        </TableCell>
                        <TableCell>{ing?.unit ?? ''}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(ing?.costPerUnit ?? 0, currency)}</TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={(ing?.currentStock ?? 0) < (ing?.minStock ?? 0) ? 'text-destructive font-medium' : ''}>
                            {ing?.currentStock ?? 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{ing?.supplier?.name ?? '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Link href={`/ingredients/${ing?.id}`}>
                              <Button variant="ghost" size="icon-sm" title="Ver detalle">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(ing); setDialogOpen(true) }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(ing?.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <IngredientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ingredient={editItem}
        onSuccess={() => { fetchData(); setDialogOpen(false); setEditItem(null) }}
      />
    </div>
  )
}
