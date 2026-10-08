'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FadeIn } from '@/components/ui/animate'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Pencil, Trash2, Truck, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { SupplierDialog } from './supplier-dialog'

export function SuppliersClient() {
  const searchParams = useSearchParams()
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) setSuppliers(await res.json())
    } catch { console.error('Failed') } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    if (searchParams?.get('action') === 'new') setDialogOpen(true)
  }, [searchParams])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Proveedor eliminado'); fetchData() }
      else toast.error('Error al eliminar')
    } catch { toast.error('Error de conexión') }
  }

  const filtered = (suppliers ?? []).filter((s: any) =>
    (s?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (s?.contactPerson ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" /> Proveedores
            </h1>
            <p className="text-muted-foreground mt-1">Gestiona tus proveedores</p>
          </div>
          <Button onClick={() => { setEditItem(null); setDialogOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" /> Nuevo Proveedor
          </Button>
        </div>
      </FadeIn>
      <FadeIn delay={0.1}>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar proveedores..." className="pl-10" value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
        </div>
      </FadeIn>
      <FadeIn delay={0.2}>
        <Card>
          <CardContent className="p-0">
            {loading ? <div className="p-8 text-center text-muted-foreground">Cargando...</div>
            : filtered.length === 0 ? <div className="p-8 text-center text-muted-foreground">{search ? 'Sin resultados' : 'No hay proveedores. ¡Añade el primero!'}</div>
            : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-center">Ingredientes</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s: any) => (
                      <TableRow key={s?.id}>
                        <TableCell className="font-medium">{s?.name ?? ''}</TableCell>
                        <TableCell className="text-muted-foreground">{s?.contactPerson ?? '-'}</TableCell>
                        <TableCell>{s?.phone ? <span className="flex items-center gap-1 text-sm"><Phone className="w-3 h-3" />{s.phone}</span> : '-'}</TableCell>
                        <TableCell>{s?.email ? <span className="flex items-center gap-1 text-sm" suppressHydrationWarning><Mail className="w-3 h-3" />{s.email}</span> : '-'}</TableCell>
                        <TableCell className="text-center"><Badge variant="secondary">{s?._count?.ingredients ?? 0}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(s); setDialogOpen(true) }}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(s?.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
      <SupplierDialog open={dialogOpen} onOpenChange={setDialogOpen} supplier={editItem}
        onSuccess={() => { fetchData(); setDialogOpen(false); setEditItem(null) }} />
    </div>
  )
}
