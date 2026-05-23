import { beforeEach, afterAll } from 'vitest'
import { prisma } from '../src/lib/prisma.js'

beforeEach(async () => {
  await prisma.reservation.deleteMany()
  await prisma.loan.deleteMany()
  await prisma.book.deleteMany()
  await prisma.author.deleteMany()
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
