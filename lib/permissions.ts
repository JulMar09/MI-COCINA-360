// Sistema centralizado de roles y permisos para MI COCINA 360
// Fuente única de verdad para qué puede hacer cada rol.

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export type Role = 'ADMIN' | 'ENCARGADO' | 'COCINERO' | 'CONSULTA'

export type Permission =
  | 'ingredients:read' | 'ingredients:write'
  | 'inventory:read'
  | 'shopping_list:read' | 'shopping_list:write'
  | 'suppliers:read' | 'suppliers:write'
  | 'delivery_notes:read' | 'delivery_notes:write'
  | 'recipes:read' | 'recipes:write'
  | 'food_cost:read' | 'food_cost:write'
  | 'price_history:read'
  | 'alerts:read' | 'alerts:write'
  | 'settings:read' | 'settings:write'
  | 'users:read' | 'users:write'
  | 'dashboard:read'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'ingredients:read', 'ingredients:write',
    'inventory:read',
    'shopping_list:read', 'shopping_list:write',
    'suppliers:read', 'suppliers:write',
    'delivery_notes:read', 'delivery_notes:write',
    'recipes:read', 'recipes:write',
    'food_cost:read', 'food_cost:write',
    'price_history:read',
    'alerts:read', 'alerts:write',
    'settings:read', 'settings:write',
    'users:read', 'users:write',
    'dashboard:read',
  ],
  ENCARGADO: [
    'ingredients:read', 'ingredients:write',
    'inventory:read',
    'shopping_list:read', 'shopping_list:write',
    'suppliers:read', 'suppliers:write',
    'delivery_notes:read', 'delivery_notes:write',
    'recipes:read', 'recipes:write',
    'food_cost:read',
    'price_history:read',
    'alerts:read', 'alerts:write',
    'settings:read',
    'dashboard:read',
  ],
  COCINERO: [
    'ingredients:read',
    'inventory:read',
    'shopping_list:read', 'shopping_list:write',
    'recipes:read',
    'alerts:read',
    'dashboard:read',
  ],
  CONSULTA: [
    'ingredients:read',
    'inventory:read',
    'shopping_list:read',
    'suppliers:read',
    'delivery_notes:read',
    'recipes:read',
    'food_cost:read',
    'price_history:read',
    'alerts:read',
    'settings:read',
    'dashboard:read',
  ],
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  ENCARGADO: 'Encargado',
  COCINERO: 'Cocinero',
  CONSULTA: 'Consulta',
}

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: 'Acceso completo a todas las funcionalidades',
  ENCARGADO: 'Gestión operativa completa sin configuración administrativa',
  COCINERO: 'Acceso a ingredientes, recetas, inventario y lista de compras',
  CONSULTA: 'Acceso de solo lectura a la información',
}

export const ALL_ROLES: Role[] = ['ADMIN', 'ENCARGADO', 'COCINERO', 'CONSULTA']

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

/** Check if role can write (create/update/delete) for a given area */
export function canWrite(role: Role, area: string): boolean {
  return hasPermission(role, `${area}:write` as Permission)
}

/** Check if role can read for a given area */
export function canRead(role: Role, area: string): boolean {
  return hasPermission(role, `${area}:read` as Permission)
}

// ─── API Helpers ────────────────────────────────────────────────

export interface KitchenAccess {
  kitchen: { id: string; [key: string]: any }
  role: Role
  userId: string
  memberId: string
}

/**
 * Get the current user's kitchen membership.
 * Looks up KitchenMember first; falls back to Kitchen.userId for backward compat.
 */
export async function getKitchenAccess(userId: string): Promise<KitchenAccess | null> {
  // Try KitchenMember first
  const member = await prisma.kitchenMember.findFirst({
    where: { userId, isActive: true },
    include: { kitchen: true },
    orderBy: { createdAt: 'desc' },
  })

  if (member) {
    return {
      kitchen: member.kitchen,
      role: member.role as Role,
      userId,
      memberId: member.id,
    }
  }

  // Fallback: direct Kitchen.userId (pre-migration)
  const kitchen = await prisma.kitchen.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  if (kitchen) {
    // Auto-create member entry for backward compat
    const created = await prisma.kitchenMember.create({
      data: { userId, kitchenId: kitchen.id, role: 'ADMIN' },
    })
    return {
      kitchen,
      role: 'ADMIN',
      userId,
      memberId: created.id,
    }
  }

  return null
}

/**
 * Protect an API route. Returns KitchenAccess or a NextResponse error.
 * Usage:
 *   const access = await requirePermission('ingredients:read')
 *   if ('error' in access) return access.error
 *   const { kitchen, role } = access
 */
export async function requirePermission(
  permission: Permission
): Promise<KitchenAccess | { error: NextResponse }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) }
  }

  const access = await getKitchenAccess(session.user.id)
  if (!access) {
    return { error: NextResponse.json({ error: 'Sin cocina asignada' }, { status: 403 }) }
  }

  if (!hasPermission(access.role, permission)) {
    return { error: NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 }) }
  }

  return access
}
