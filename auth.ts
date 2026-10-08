import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findFirst({
          where: { email: { equals: (credentials.email as string).trim(), mode: 'insensitive' } },
        })
        if (!user?.password) return null
        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        // Fetch role from KitchenMember
        try {
          const member = await prisma.kitchenMember.findFirst({
            where: { userId: token.id as string, isActive: true },
            select: { role: true },
            orderBy: { createdAt: 'desc' },
          })
          session.user.role = (member?.role as string) ?? 'CONSULTA'
        } catch {
          session.user.role = 'CONSULTA'
        }
      }
      return session
    },
  },
})
