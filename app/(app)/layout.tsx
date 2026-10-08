import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { AppLayoutClient } from './_components/app-layout-client'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const kitchen = await prisma.kitchen.findFirst({ where: { userId: session.user.id } })
  if (!kitchen) redirect('/onboarding')
  return <AppLayoutClient>{children}</AppLayoutClient>
}
