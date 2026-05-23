import express from 'express'
import { authRouter } from './routes/auth.js'
import { authorsRouter } from './routes/authors.js'
import { booksRouter } from './routes/books.js'
import { loansRouter } from './routes/loans.js'
import { reservationsRouter } from './routes/reservations.js'

export function createApp() {
  const app = express()

  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.use('/auth', authRouter)
  app.use('/authors', authorsRouter)
  app.use('/books', booksRouter)
  app.use('/loans', loansRouter)
  app.use('/reservations', reservationsRouter)

  app.use((_req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' })
  })

  return app
}
