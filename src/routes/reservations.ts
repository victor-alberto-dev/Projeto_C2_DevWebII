import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { createReservationSchema } from '../schemas/reservation.schema.js'

export const reservationsRouter = Router()

reservationsRouter.get('/', authenticate, async (req: Request, res: Response) => {
  const where = req.user!.role === 'ADMIN' ? {} : { userId: req.user!.sub }
  const reservations = await prisma.reservation.findMany({
    where,
    include: {
      book: { select: { id: true, title: true, isbn: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(reservations)
})

reservationsRouter.get('/:id', authenticate, async (req: Request, res: Response) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: req.params['id'] },
    include: {
      book: { select: { id: true, title: true, isbn: true, author: { select: { name: true } } } },
      user: { select: { id: true, name: true, email: true } },
    },
  })
  if (!reservation) {
    res.status(404).json({ error: 'Reserva não encontrada' })
    return
  }
  if (req.user!.role !== 'ADMIN' && reservation.userId !== req.user!.sub) {
    res.status(403).json({ error: 'Acesso negado' })
    return
  }
  res.json(reservation)
})

reservationsRouter.post('/', authenticate, async (req: Request, res: Response) => {
  const result = createReservationSchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({ error: 'Dados inválidos', details: result.error.issues })
    return
  }
  const { bookId } = result.data

  const book = await prisma.book.findUnique({ where: { id: bookId } })
  if (!book) {
    res.status(404).json({ error: 'Livro não encontrado' })
    return
  }

  const alreadyReserved = await prisma.reservation.findFirst({
    where: { userId: req.user!.sub, bookId, status: 'PENDING' },
  })
  if (alreadyReserved) {
    res.status(400).json({ error: 'Você já possui uma reserva pendente para este livro' })
    return
  }

  const reservation = await prisma.reservation.create({
    data: { userId: req.user!.sub, bookId },
    include: { book: { select: { id: true, title: true } } },
  })
  res.status(201).json(reservation)
})

reservationsRouter.patch('/:id/confirm', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  const reservation = await prisma.reservation.findUnique({ where: { id: req.params['id'] } })
  if (!reservation) {
    res.status(404).json({ error: 'Reserva não encontrada' })
    return
  }
  if (reservation.status !== 'PENDING') {
    res.status(400).json({ error: 'Apenas reservas pendentes podem ser confirmadas' })
    return
  }
  const updated = await prisma.reservation.update({
    where: { id: req.params['id'] },
    data: { status: 'CONFIRMED' },
    include: { book: { select: { id: true, title: true } } },
  })
  res.json(updated)
})

reservationsRouter.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const reservation = await prisma.reservation.findUnique({ where: { id: req.params['id'] } })
  if (!reservation) {
    res.status(404).json({ error: 'Reserva não encontrada' })
    return
  }
  if (req.user!.role !== 'ADMIN' && reservation.userId !== req.user!.sub) {
    res.status(403).json({ error: 'Acesso negado: somente o dono pode cancelar sua reserva' })
    return
  }
  await prisma.reservation.update({
    where: { id: req.params['id'] },
    data: { status: 'CANCELLED' },
  })
  res.status(204).send()
})
