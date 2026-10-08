export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getKitchenAlerts, KitchenAlert } from '@/lib/alerts'
import { requirePermission } from '@/lib/permissions'

export async function GET() {
  const access = await requirePermission('alerts:read')
  if ('error' in access) return access.error
  const kitchen = access.kitchen
  if (!kitchen) return NextResponse.json({ error: 'Sin cocina' }, { status: 404 })

  const liveAlerts = await getKitchenAlerts(prisma, kitchen)
  const reviews = await prisma.alertReview.findMany({ where: { kitchenId: kitchen.id } })
  const reviewByKey = new Map<string, any>()
  for (const r of reviews) reviewByKey.set(r.alertKey, r)

  const liveKeys = new Set(liveAlerts.map((a) => a.alertKey))

  // Alertas vivas + su estado
  const merged = liveAlerts.map((a: KitchenAlert) => {
    const review = reviewByKey.get(a.alertKey)
    const status = review?.status === 'revisada' ? 'revisada' : 'pendiente'
    return {
      ...a,
      status,
      active: true,
      reviewedAt: status === 'revisada' ? review?.reviewedAt ?? null : null,
      comment: review?.comment ?? null,
    }
  })

  // Alertas revisadas que ya no están vivas (historial): se conservan pero se
  // marcan como resueltas para distinguirlas.
  const historical = reviews
    .filter((r: any) => r.status === 'revisada' && !liveKeys.has(r.alertKey))
    .map((r: any) => ({
      alertKey: r.alertKey,
      type: r.type,
      severity: r.severity,
      title: r.title,
      description: r.description,
      elementId: r.elementId ?? '',
      href: r.href ?? '',
      date: r.reviewedAt,
      status: 'revisada' as const,
      active: false,
      reviewedAt: r.reviewedAt,
      comment: r.comment ?? null,
    }))

  const alerts = [...merged, ...historical]

  const counters = {
    total: alerts.length,
    pendientes: merged.filter((a) => a.status === 'pendiente').length,
    revisadas: alerts.filter((a) => a.status === 'revisada').length,
    criticas: merged.filter((a) => a.severity === 'critical' && a.status === 'pendiente').length,
    atencion: merged.filter((a) => a.severity === 'warning' && a.status === 'pendiente').length,
    informacion: merged.filter((a) => a.severity === 'info' && a.status === 'pendiente').length,
  }

  return NextResponse.json({ alerts, counters, currency: kitchen.currency })
}
