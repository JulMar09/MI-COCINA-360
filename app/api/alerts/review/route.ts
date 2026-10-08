export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/permissions'

export async function POST(req: Request) {
  const access = await requirePermission('alerts:write')
  if ('error' in access) return access.error
  const kitchen = access.kitchen
  if (!kitchen) return NextResponse.json({ error: 'Sin cocina' }, { status: 404 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const alertKey = body?.alertKey
  if (!alertKey || typeof alertKey !== 'string') {
    return NextResponse.json({ error: 'Falta el identificador de la alerta' }, { status: 400 })
  }

  const action = body?.action === 'pendiente' ? 'pendiente' : 'revisada'

  const snapshot = {
    type: String(body?.type ?? ''),
    severity: String(body?.severity ?? 'info'),
    title: String(body?.title ?? ''),
    description: String(body?.description ?? ''),
    href: body?.href ? String(body.href) : null,
    elementId: body?.elementId ? String(body.elementId) : null,
    comment: body?.comment ? String(body.comment) : null,
  }

  const review = await prisma.alertReview.upsert({
    where: { kitchenId_alertKey: { kitchenId: kitchen.id, alertKey } },
    update: {
      status: action,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
      ...snapshot,
    },
    create: {
      kitchenId: kitchen.id,
      alertKey,
      status: action,
      reviewedById: session.user.id,
      ...snapshot,
    },
  })

  return NextResponse.json({ ok: true, status: review.status })
}
