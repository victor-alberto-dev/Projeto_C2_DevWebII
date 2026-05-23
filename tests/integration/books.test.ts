import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'

const app = createApp()

async function getAdminToken() {
  await request(app).post('/auth/register').send({ name: 'Admin', email: 'admin@test.com', password: 'admin123' })
  const { prisma } = await import('../../src/lib/prisma.js')
  await prisma.user.update({ where: { email: 'admin@test.com' }, data: { role: 'ADMIN' } })
  const login = await request(app).post('/auth/login').send({ email: 'admin@test.com', password: 'admin123' })
  return login.body.token as string
}

async function createAuthorAndBook(token: string) {
  const author = await request(app)
    .post('/authors')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Autor Teste' })

  const book = await request(app)
    .post('/books')
    .set('Authorization', `Bearer ${token}`)
    .send({ title: 'Livro Teste', isbn: '978-0-13-110362-7', year: 2020, authorId: author.body.id })

  return { author: author.body, book: book.body }
}

describe('GET /books', () => {
  it('deve listar livros publicamente com autor', async () => {
    const res = await request(app).get('/books')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('POST /books', () => {
  it('deve criar livro como ADMIN com relacionamento', async () => {
    const token = await getAdminToken()
    const { book } = await createAuthorAndBook(token)
    expect(book.id).toBeDefined()
    expect(book.author).toHaveProperty('name')
  })

  it('deve retornar 404 para autor inexistente', async () => {
    const token = await getAdminToken()
    const res = await request(app)
      .post('/books')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Livro', isbn: '978-0-00-000000-2', year: 2020, authorId: '00000000-0000-0000-0000-000000000000' })
    expect(res.status).toBe(404)
  })

  it('deve retornar 403 para USER', async () => {
    await request(app).post('/auth/register').send({ name: 'User', email: 'user@test.com', password: 'user123' })
    const login = await request(app).post('/auth/login').send({ email: 'user@test.com', password: 'user123' })
    const res = await request(app)
      .post('/books')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ title: 'Livro', isbn: '1234567890', year: 2020, authorId: '00000000-0000-0000-0000-000000000000' })
    expect(res.status).toBe(403)
  })
})

describe('GET /books/:id', () => {
  it('deve retornar livro com autor e relacionamentos', async () => {
    const token = await getAdminToken()
    const { book } = await createAuthorAndBook(token)
    const res = await request(app).get(`/books/${book.id}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('author')
    expect(res.body).toHaveProperty('loans')
    expect(res.body).toHaveProperty('reservations')
  })

  it('deve retornar 404 para livro inexistente', async () => {
    const res = await request(app).get('/books/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})

describe('PUT /books/:id', () => {
  it('deve atualizar livro como ADMIN', async () => {
    const token = await getAdminToken()
    const { book } = await createAuthorAndBook(token)
    const res = await request(app)
      .put(`/books/${book.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Título Atualizado' })
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Título Atualizado')
  })
})

describe('DELETE /books/:id', () => {
  it('deve deletar livro como ADMIN', async () => {
    const token = await getAdminToken()
    const { book } = await createAuthorAndBook(token)
    const res = await request(app)
      .delete(`/books/${book.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)
  })
})
