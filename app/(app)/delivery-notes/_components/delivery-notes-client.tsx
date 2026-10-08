'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useKitchen } from '@/lib/kitchen-context'
import { formatCurrency } from '@/lib/currency'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/animate'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Trash2, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { DeliveryNoteDialog } from './delivery-note-dialog'
import { SafeDate } from '@/components/safe-format'

export function DeliveryNotesClient() {
  const { kitchen } = useKitchen()
  const searchParams = useSearchParams()
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/delivery-notes')
      if (res.ok) setNotes(await res.json())
    } catch { console.error('Failed') } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    if (searchParams?.get('action') === 'new') setDialogOpen(true)
  }, [searchParams])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este albarán?')) return
    try {
      const res = await fetch(`/api/delivery-notes/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Albarán eliminado'); fetchData() }
      else toast.error('Error al eliminar')
    } catch { toast.error('Error de conexión') }
  }

  const filtered = (notes ?? []).filter((n: any) =>
    (n?.supplier?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (n?.ingredient?.name ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const currency = kitchen?.currency ?? 'EUR'

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" /> Albaranes
            </h1>
            <p className="text-muted-foreground mt-1">Registra las entregas de tus proveedores</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Albarán
          </Button>
        </div>
      </FadeIn>
      <FadeIn delay={0.1}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por proveedor o ingrediente..." className="pl-10" value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
        </div>
      </FadeIn>
      <FadeIn delay={0.2}>
        <Card>
          <CardContent className="p-0">
            {loading ? <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">{search ? 'Sin resultados' : 'No hay albaranes registrados.'}</div>
            : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-right">Precio/Ud</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((n: any) => (
                      <TableRow key={n?.id}>
                        <TableCell><SafeDate date={n?.date} options={{ dateStyle: 'medium' }} locale="es-ES" /></TableCell>
                        <TableCell className="font-medium">{n?.supplier?.name ?? '-'}</TableCell>
                        <TableCell>{n?.ingredient?.name ?? '-'}</TableCell>
                        <TableCell className="text-right font-mono">{n?.quantity ?? 0}</TableCell>
                        <TableCell>{n?.unit ?? ''}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(n?.unitPrice ?? 0, currency)}</TableCell>
                        <TableCell className="text-right font-mono font-medium">{formatCurrency(n?.totalPrice ?? 0, currency)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(n?.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
      <DeliveryNoteDialog open={dialogOpen} onOpenChange={setDialogOpen}
        onSuccess={() => { fetchData(); setDialogOpen(false) }} />
    </div>
  )
}
