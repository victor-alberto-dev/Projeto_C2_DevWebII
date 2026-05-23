import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { createLoanSchema } from '../schemas/loan.schema.js'

export const loansRouter = Router()

loansRouter.get('/', authenticate, async (req: Request, res: Response) => {
  const where = req.user!.role === 'ADMIN' ? {} : { userId: req.user!.sub }
  const loans = await prisma.loan.findMany({
    where,
    include: {
      book: { select: { id: true, title: true, isbn: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(loans)
})

loansRouter.get('/:id', authenticate, async (req: Request, res: Response) => {
  const loan = await prisma.loan.findUnique({
    where: { id: req.params['id'] as string },
    include: {
      book: { select: { id: true, title: true, isbn: true, author: { select: { name: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
  })
  if (!loan) {
    res.status(404).json({ error: 'Empréstimo não encontrado' })
    return
  }
  if (req.user!.role !== 'ADMIN' && loan.userId !== req.user!.sub) {
    res.status(403).json({ error: 'Acesso negado' })
    return
  }
  res.json(loan)
})

loansRouter.post('/', authenticate, async (req: Request, res: Response) => {
  const result = createLoanSchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({ error: 'Dados inválidos', details: result.error.issues })
    return
  }
  const { bookId, dueDate } = result.data

  const book = await prisma.book.findUnique({ where: { id: bookId } })
  if (!book) {
    res.status(404).json({ error: 'Livro não encontrado' })
    return
  }
  if (!book.available) {
    res.status(400).json({ error: 'Livro não disponível para empréstimo' })
    return
  }

  const [loan] = await prisma.$transaction([
    prisma.loan.create({
      data: { userId: req.user!.sub, bookId, dueDate: new Date(dueDate) },
      include: { book: { select: { id: true, title: true } } },
    }),
    prisma.book.update({ where: { id: bookId }, data: { available: false } }),
  ])

  res.status(201).json(loan)
})

loansRouter.patch('/:id/return', authenticate, async (req: Request, res: Response) => {
  const loan = await prisma.loan.findUnique({ where: { id: req.params['id'] as string } })
  if (!loan) {
    res.status(404).json({ error: 'Empréstimo não encontrado' })
    return
  }
  if (req.user!.role !== 'ADMIN' && loan.userId !== req.user!.sub) {
    res.status(403).json({ error: 'Acesso negado' })
    return
  }
  if (loan.returnedAt) {
    res.status(400).json({ error: 'Livro já devolvido' })
    return
  }

  const [updated] = await prisma.$transaction([
    prisma.loan.update({
      where: { id: req.params['id'] as string },
      data: { returnedAt: new Date() },
      include: { book: { select: { id: true, title: true } } },
    }),
    prisma.book.update({ where: { id: loan.bookId }, data: { available: true } }),
  ])

  res.json(updated)
})

loansRouter.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  const exists = await prisma.loan.findUnique({ where: { id: req.params['id'] as string } })
  if (!exists) {
    res.status(404).json({ error: 'Empréstimo não encontrado' })
    return
  }
  await prisma.loan.delete({ where: { id: req.params['id'] as string } })
  res.status(204).send()
})
