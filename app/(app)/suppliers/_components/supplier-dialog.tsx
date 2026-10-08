'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: any
  onSuccess: () => void
}

export function SupplierDialog({ open, onOpenChange, supplier, onSuccess }: Props) {
  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      if (supplier) {
        setName(supplier?.name ?? ''); setContactPerson(supplier?.contactPerson ?? '')
        setPhone(supplier?.phone ?? ''); setEmail(supplier?.email ?? ''); setNotes(supplier?.notes ?? '')
      } else {
        setName(''); setContactPerson(''); setPhone(''); setEmail(''); setNotes('')
      }
    }
  }, [open, supplier])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)
    try {
      const body = { name, contactPerson: contactPerson || null, phone: phone || null, email: email || null, notes: notes || null }
      const url = supplier ? `/api/suppliers/${supplier.id}` : '/api/suppliers'
      const method = supplier ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) { toast.success(supplier ? 'Proveedor actualizado' : 'Proveedor creado'); onSuccess() }
      else { const data = await res.json(); toast.error(data?.error || 'Error') }
    } catch { toast.error('Error de conexión') } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label>Nombre *</Label><Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Nombre del proveedor" required /></div>
          <div className="space-y-2"><Label>Persona de Contacto</Label><Input value={contactPerson} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactPerson(e.target.value)} placeholder="Nombre contacto" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Teléfono</Label><Input value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} placeholder="+34 ..." /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="email@proveedor.com" /></div>
          </div>
          <div className="space-y-2"><Label>Notas</Label><Textarea value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} placeholder="Notas adicionales..." /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" loading={loading}>{supplier ? 'Guardar' : 'Crear'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
