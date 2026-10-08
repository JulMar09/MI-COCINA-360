'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useKitchen } from '@/lib/kitchen-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FadeIn } from '@/components/ui/animate'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, UserPlus, Shield, ShieldCheck, ChefHat, Eye, Power } from 'lucide-react'
import { SafeDate } from '@/components/safe-format'

interface Member {
  id: string
  userId: string
  name: string | null
  email: string
  role: string
  isActive: boolean
  createdAt: string
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  ENCARGADO: 'Encargado',
  COCINERO: 'Cocinero',
  CONSULTA: 'Consulta',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  ENCARGADO: 'bg-blue-100 text-blue-700 border-blue-200',
  COCINERO: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CONSULTA: 'bg-gray-100 text-gray-600 border-gray-200',
}

const ROLE_ICONS: Record<string, any> = {
  ADMIN: Shield,
  ENCARGADO: ShieldCheck,
  COCINERO: ChefHat,
  CONSULTA: Eye,
}

export function UsersClient() {
  const { data: session } = useSession() || {}
  const { kitchen } = useKitchen()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('COCINERO')
  const [error, setError] = useState('')

  const isAdmin = kitchen?.role === 'ADMIN'

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) setMembers(await res.json())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, role }),
      })
      if (res.ok) {
        setDialogOpen(false)
        setEmail(''); setName(''); setPassword(''); setRole('COCINERO')
        fetchMembers()
      } else {
        const data = await res.json()
        setError(data.error || 'Error al añadir usuario')
      }
    } catch { setError('Error de conexión') }
    finally { setSaving(false) }
  }

  const handleToggleActive = async (memberId: string, isActive: boolean) => {
    try {
      await fetch(`/api/users/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      fetchMembers()
    } catch {}
  }

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      await fetch(`/api/users/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      fetchMembers()
    } catch {}
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <FadeIn>
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            No tienes permisos para acceder a esta sección.
          </CardContent></Card>
        </FadeIn>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Usuarios y permisos
            </h1>
            <p className="text-muted-foreground mt-1">Gestión de acceso del equipo</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> Añadir usuario
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Total usuarios</p>
              <p className="text-2xl font-mono font-bold mt-1">{members.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Activos</p>
              <p className="text-2xl font-mono font-bold mt-1">{members.filter(m => m.isActive).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Administradores</p>
              <p className="text-2xl font-mono font-bold mt-1">{members.filter(m => m.role === 'ADMIN').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Inactivos</p>
              <p className="text-2xl font-mono font-bold mt-1">{members.filter(m => !m.isActive).length}</p>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando usuarios...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead>Miembro desde</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(m => {
                      const Icon = ROLE_ICONS[m.role] || Eye
                      const isCurrentUser = m.userId === session?.user?.id
                      return (
                        <TableRow key={m.id} className={!m.isActive ? 'opacity-50' : ''}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{m.name || 'Sin nombre'}</p>
                              <p className="text-xs text-muted-foreground">{m.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <select
                              value={m.role}
                              onChange={(e) => handleChangeRole(m.id, e.target.value)}
                              disabled={isCurrentUser}
                              className="text-xs rounded border px-2 py-1 bg-background"
                            >
                              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={m.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                              {m.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <SafeDate date={m.createdAt} options={{ dateStyle: 'medium' }} />
                          </TableCell>
                          <TableCell className="text-center">
                            {!isCurrentUser && (
                              <Button
                                size="sm"
                                variant={m.isActive ? 'outline' : 'default'}
                                className="h-7 text-xs gap-1"
                                onClick={() => handleToggleActive(m.id, m.isActive)}
                              >
                                <Power className="w-3 h-3" />
                                {m.isActive ? 'Desactivar' : 'Activar'}
                              </Button>
                            )}
                            {isCurrentUser && (
                              <span className="text-xs text-muted-foreground">Tú</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Invite Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Añadir usuario</DialogTitle></DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contraseña *</Label>
              <Input type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Rol *</Label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm bg-background">
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Añadir'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
