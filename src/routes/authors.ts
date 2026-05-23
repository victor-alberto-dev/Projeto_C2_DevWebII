import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { createAuthorSchema, updateAuthorSchema } from '../schemas/author.schema.js'

export const authorsRouter = Router()

authorsRouter.get('/', async (_req: Request, res: Response) => {
  const authors = await prisma.author.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { books: true } } },
  })
  res.json(authors)
})

authorsRouter.get('/:id', async (req: Request, res: Response) => {
  const author = await prisma.author.findUnique({
    where: { id: req.params['id'] },
    include: { books: { select: { id: true, title: true, year: true, available: true } } },
  })
  if (!author) {
    res.status(404).json({ error: 'Autor não encontrado' })
    return
  }
  res.json(author)
})

authorsRouter.post('/', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  const result = createAuthorSchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({ error: 'Dados inválidos', details: result.error.issues })
    return
  }
  const author = await prisma.author.create({ data: result.data })
  res.status(201).json(author)
})

authorsRouter.put('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  const result = updateAuthorSchema.safeParse(req.body)
  if (!result.success) {
    res.status(422).json({ error: 'Dados inválidos', details: result.error.issues })
    return
  }
  const exists = await prisma.author.findUnique({ where: { id: req.params['id'] } })
  if (!exists) {
    res.status(404).json({ error: 'Autor não encontrado' })
    return
  }
  const author = await prisma.author.update({ where: { id: req.params['id'] }, data: result.data })
  res.json(author)
})

authorsRouter.delete('/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  const exists = await prisma.author.findUnique({ where: { id: req.params['id'] } })
  if (!exists) {
    res.status(404).json({ error: 'Autor não encontrado' })
    return
  }
  await prisma.author.delete({ where: { id: req.params['id'] } })
  res.status(204).send()
})
