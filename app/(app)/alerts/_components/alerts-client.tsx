'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FadeIn } from '@/components/ui/animate'
import { SafeDate } from '@/components/safe-format'
import { getAlertTypeLabel } from '@/lib/alerts'
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowRight,
  Clock,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'

interface AlertItem {
  alertKey: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  elementId: string
  href: string
  date: string
  status: 'pendiente' | 'revisada'
  active: boolean
  reviewedAt: string | null
  comment: string | null
}

interface Counters {
  total: number
  pendientes: number
  revisadas: number
  criticas: number
  atencion: number
  informacion: number
}

type FilterKey =
  | 'todas'
  | 'pendientes'
  | 'revisadas'
  | 'criticas'
  | 'atencion'
  | 'informacion'

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical') return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
  if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
  return <Info className="w-5 h-5 text-blue-500 shrink-0" />
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  }
  const labels: Record<string, string> = {
    critical: 'Crítico',
    warning: 'Atención',
    info: 'Información',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[severity] ?? styles.info}`}>
      {labels[severity] ?? 'Información'}
    </span>
  )
}

export function AlertsClient() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [counters, setCounters] = useState<Counters | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('todas')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [pending, setPending] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts')
      if (res.ok) {
        const json = await res.json()
        setAlerts(json.alerts ?? [])
        setCounters(json.counters ?? null)
      }
    } catch {
      console.error('No se pudieron cargar las alertas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateReview = useCallback(async (alert: AlertItem, action: 'revisada' | 'pendiente') => {
    setPending((p) => ({ ...p, [alert.alertKey]: true }))
    try {
      const res = await fetch('/api/alerts/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertKey: alert.alertKey,
          action,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          href: alert.href,
          elementId: alert.elementId,
        }),
      })
      if (res.ok) await fetchData()
    } catch {
      console.error('No se pudo actualizar la alerta')
    } finally {
      setPending((p) => ({ ...p, [alert.alertKey]: false }))
    }
  }, [fetchData])

  const availableTypes = Array.from(new Set(alerts.map((a) => a.type)))

  const filtered = alerts.filter((a) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false
    switch (filter) {
      case 'pendientes': return a.status === 'pendiente'
      case 'revisadas': return a.status === 'revisada'
      case 'criticas': return a.severity === 'critical'
      case 'atencion': return a.severity === 'warning'
      case 'informacion': return a.severity === 'info'
      default: return true
    }
  })

  // Pendientes primero, luego por gravedad, luego revisadas
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 }
  const sorted = [...filtered].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pendiente' ? -1 : 1
    return (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2)
  })

  const counterCards = [
    { label: 'Pendientes', value: counters?.pendientes ?? 0, icon: Clock, color: 'text-slate-700', bg: 'bg-slate-100' },
    { label: 'Críticas', value: counters?.criticas ?? 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Atención', value: counters?.atencion ?? 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Información', value: counters?.informacion ?? 0, icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'pendientes', label: 'Pendientes' },
    { key: 'revisadas', label: 'Revisadas' },
    { key: 'criticas', label: 'Críticas' },
    { key: 'atencion', label: 'Atención' },
    { key: 'informacion', label: 'Información' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <FadeIn>
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Centro de alertas
          </h1>
          <p className="text-muted-foreground mt-1">
            Todas las incidencias que la aplicación detecta en tu cocina, en un solo lugar
          </p>
        </div>
      </FadeIn>

      {/* Contadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {counterCards.map((c, idx) => {
          const Icon = c.icon
          return (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <p className="text-2xl font-bold font-mono mt-1">{c.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${c.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`text-sm font-medium px-3 py-1.5 rounded-full border transition-colors ${
                filter === t.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-accent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {availableTypes.length > 1 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Tipo:</span>
            <button
              onClick={() => setTypeFilter('all')}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                typeFilter === 'all'
                  ? 'bg-secondary text-secondary-foreground border-border'
                  : 'bg-background text-muted-foreground border-border hover:bg-accent'
              }`}
            >
              Todos
            </button>
            {availableTypes.map((tp) => (
              <button
                key={tp}
                onClick={() => setTypeFilter(tp)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  typeFilter === tp
                    ? 'bg-secondary text-secondary-foreground border-border'
                    : 'bg-background text-muted-foreground border-border hover:bg-accent'
                }`}
              >
                {getAlertTypeLabel(tp)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista de alertas */}
      {sorted.length === 0 ? (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="py-10">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium text-emerald-700 dark:text-emerald-400">
                  {filter === 'todas' && typeFilter === 'all'
                    ? 'No hay alertas'
                    : 'No hay alertas con este filtro'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {filter === 'todas' && typeFilter === 'all'
                    ? 'Todo está bajo control en tu cocina'
                    : 'Prueba con otro filtro para ver más alertas'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((alert) => {
            const isRevisada = alert.status === 'revisada'
            const isCritical = alert.severity === 'critical'
            return (
              <Card
                key={alert.alertKey}
                className={
                  isRevisada
                    ? 'opacity-75'
                    : isCritical
                      ? 'border-red-300 dark:border-red-800 shadow-sm'
                      : ''
                }
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <SeverityIcon severity={alert.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{alert.title}</p>
                        <SeverityBadge severity={alert.severity} />
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                          {getAlertTypeLabel(alert.type)}
                        </span>
                        {isRevisada ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Revisada
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pendiente
                          </span>
                        )}
                        {!alert.active && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">
                            Resuelta
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                      <div className="flex items-center gap-3 flex-wrap mt-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <SafeDate date={alert.date} options={{ dateStyle: 'medium', timeStyle: 'short' }} locale="es-ES" />
                        </span>
                        {isRevisada && alert.reviewedAt && (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Revisada el <SafeDate date={alert.reviewedAt} options={{ dateStyle: 'medium', timeStyle: 'short' }} locale="es-ES" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-3">
                        {alert.href && alert.active && (
                          <Link href={alert.href}>
                            <Button variant="outline" size="sm" className="h-8">
                              Ver elemento <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </Link>
                        )}
                        {isRevisada ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            disabled={pending[alert.alertKey]}
                            onClick={() => updateReview(alert, 'pendiente')}
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Marcar como pendiente
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-8"
                            disabled={pending[alert.alertKey]}
                            onClick={() => updateReview(alert, 'revisada')}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Marcar como revisada
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
