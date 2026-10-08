'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useKitchen } from '@/lib/kitchen-context'
import {
  LayoutDashboard,
  Carrot,
  Truck,
  BookOpen,
  ClipboardList,
  Package,
  Bell,
  Settings,
  ChefHat,
  History,
  ShoppingCart,
  Users,
} from 'lucide-react'
import type { Permission, Role } from '@/lib/permissions'
import { ROLE_PERMISSIONS } from '@/lib/permissions'

const NAV_ITEMS: { href: string; label: string; icon: any; permission?: Permission }[] = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard, permission: 'dashboard:read' },
  { href: '/ingredients', label: 'Ingredientes', icon: Carrot, permission: 'ingredients:read' },
  { href: '/suppliers', label: 'Proveedores', icon: Truck, permission: 'suppliers:read' },
  { href: '/recipes', label: 'Recetas', icon: BookOpen, permission: 'recipes:read' },
  { href: '/delivery-notes', label: 'Albaranes', icon: ClipboardList, permission: 'delivery_notes:read' },
  { href: '/inventory', label: 'Inventario', icon: Package, permission: 'ingredients:read' },
  { href: '/shopping-list', label: 'Lista de compras', icon: ShoppingCart, permission: 'shopping_list:read' },
  { href: '/price-history', label: 'Historial de precios', icon: History, permission: 'price_history:read' },
  { href: '/alerts', label: 'Centro de alertas', icon: Bell, permission: 'alerts:read' },
  { href: '/settings', label: 'Configuración', icon: Settings, permission: 'settings:read' },
  { href: '/users', label: 'Usuarios y permisos', icon: Users, permission: 'users:read' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { kitchen } = useKitchen()
  const userRole = kitchen?.role ?? 'CONSULTA'

  // Filter nav items based on role permissions
  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.permission) return true
    const perms = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS]
    return perms ? perms.includes(item.permission) : false
  })

  return (
    <>
      <div className="flex items-center gap-3 px-2 py-4 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <ChefHat className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-sm truncate">MI COCINA 360</p>
          <p className="text-xs text-muted-foreground truncate">{kitchen?.name ?? 'Cargando...'}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {visibleItems.map((item: { href: string; label: string; icon: any }) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
