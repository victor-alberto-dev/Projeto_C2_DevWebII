import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { createBookSchema, updateBookSchema } from '../schemas/book.schema.js'

export const booksRouter = Router()

booksRouter.get('/', async (_req: Request, res: Response) => {
  const books = await prisma.book.findMany({
    orderBy: { title: 'asc' },
    include: { author: { select: { id: true, name: true } } },
  })
  res.json(books)
})

booksRouter.get('/:id', async (req: Request, res: Response) => {
  const book = await prisma.book.findUnique({
    where: { id: req.params['id'] as string },
    include: {
      author: true,
      loans: { where: { returnedAt: null }, select: { id: true, dueDate: true } },
      reservations: { where: { status: 'PENDING' }, select: { id: true, createdAt: true } },
    },
  })
  if (!book) {
    res.status(404).json({ error: 'Livro não encontrado' })
    return
  }
  res.json(book)
})

booksRouter.post('/', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  const result = createBookSchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({ error: 'Dados inválidos', details: result.error.issues })
    return
  }
  const authorExists = await prisma.author.findUnique({ where: { id: result.data.authorId } })
  if (!authorExists) {
    res.status(404).json({ error: 'Autor não encontrado' })
    return
  }
  try {
    const book = await prisma.book.create({
      data: result.data,
      include: { author: { select: { id: true, name: true } } },
    })
    res.status(201).json(book)
  } catch (err: any) {
    if (err?.code === 'P2002') {
      res.status(400).json({ error: 'ISBN já cadastrado' })
      return
    }
    throw err
  }
})

booksRouter.put('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  const result = updateBookSchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({ error: 'Dados inválidos', details: result.error.issues })
    return
  }
  const exists = await prisma.book.findUnique({ where: { id: req.params['id'] as string } })
  if (!exists) {
    res.status(404).json({ error: 'Livro não encontrado' })
    return
  }
  if (result.data.authorId) {
    const authorExists = await prisma.author.findUnique({ where: { id: result.data.authorId } })
    if (!authorExists) {
      res.status(404).json({ error: 'Autor não encontrado' })
      return
    }
  }
  const book = await prisma.book.update({
    where: { id: req.params['id'] as string },
    data: result.data,
    include: { author: { select: { id: true, name: true } } },
  })
  res.json(book)
})

booksRouter.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  const exists = await prisma.book.findUnique({ where: { id: req.params['id'] as string } })
  if (!exists) {
    res.status(404).json({ error: 'Livro não encontrado' })
    return
  }
  await prisma.book.delete({ where: { id: req.params['id'] as string } })
  res.status(204).send()
})
