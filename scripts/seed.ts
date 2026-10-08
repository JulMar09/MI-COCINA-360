import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hidden test account
  const testPassword = await bcrypt.hash('9OnmeDyJ*l', 12)
  await prisma.user.upsert({
    where: { email: 'abacus-e32a6312@example.com' },
    update: {},
    create: {
      email: 'abacus-e32a6312@example.com',
      password: testPassword,
      name: 'Test Admin',
    },
  })

  console.log('Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
