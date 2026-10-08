'use client'

import { KitchenProvider } from '@/lib/kitchen-context'
import { AppSidebar } from './app-sidebar'
import { AppShell } from '@/components/layouts/app-shell'
import { AppHeaderContent } from './app-header'

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <KitchenProvider>
      <AppShell
        sidebar={<AppSidebar />}
        header={<AppHeaderContent />}
      >
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </AppShell>
    </KitchenProvider>
  )
}
