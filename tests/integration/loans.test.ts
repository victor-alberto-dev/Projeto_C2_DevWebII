import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'

const app = createApp()

async function setupUsers() {
  await request(app).post('/auth/register').send({ name: 'Admin', email: 'admin@test.com', password: 'admin123' })
  await request(app).post('/auth/register').send({ name: 'User A', email: 'usera@test.com', password: 'user123' })
  await request(app).post('/auth/register').send({ name: 'User B', email: 'userb@test.com', password: 'user123' })
  const { prisma } = await import('../../src/lib/prisma.js')
  await prisma.user.update({ where: { email: 'admin@test.com' }, data: { role: 'ADMIN' } })
  const adminLogin = await request(app).post('/auth/login').send({ email: 'admin@test.com', password: 'admin123' })
  const userALogin = await request(app).post('/auth/login').send({ email: 'usera@test.com', password: 'user123' })
  const userBLogin = await request(app).post('/auth/login').send({ email: 'userb@test.com', password: 'user123' })
  return {
    adminToken: adminLogin.body.token as string,
    userAToken: userALogin.body.token as string,
    userBToken: userBLogin.body.token as string,
  }
}

async function createBook(adminToken: string) {
  const author = await request(app)
    .post('/authors')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Autor Empréstimo' })
  const book = await request(app)
    .post('/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Livro Empréstimo', isbn: '978-0-13-468599-1', year: 2021, authorId: author.body.id })
  return book.body
}

describe('POST /loans', () => {
  it('deve criar empréstimo com sucesso', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const book = await createBook(adminToken)
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString()
    const res = await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ bookId: book.id, dueDate })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
  })

  it('deve retornar 400 para livro indisponível', async () => {
    const { adminToken, userAToken, userBToken } = await setupUsers()
    const book = await createBook(adminToken)
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString()
    await request(app).post('/loans').set('Authorization', `Bearer ${userAToken}`).send({ bookId: book.id, dueDate })
    const res = await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({ bookId: book.id, dueDate })
    expect(res.status).toBe(400)
  })

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).post('/loans').send({ bookId: '00000000-0000-0000-0000-000000000000', dueDate: new Date().toISOString() })
    expect(res.status).toBe(401)
  })
})

describe('GET /loans', () => {
  it('USER só vê seus próprios empréstimos', async () => {
    const { adminToken, userAToken, userBToken } = await setupUsers()
    const book = await createBook(adminToken)
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString()
    await request(app).post('/loans').set('Authorization', `Bearer ${userAToken}`).send({ bookId: book.id, dueDate })
    const res = await request(app).get('/loans').set('Authorization', `Bearer ${userBToken}`)
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(0)
  })
})

describe('PATCH /loans/:id/return', () => {
  it('deve devolver livro como dono', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const book = await createBook(adminToken)
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString()
    const loan = await request(app).post('/loans').set('Authorization', `Bearer ${userAToken}`).send({ bookId: book.id, dueDate })
    const res = await request(app)
      .patch(`/loans/${loan.body.id}/return`)
      .set('Authorization', `Bearer ${userAToken}`)
    expect(res.status).toBe(200)
    expect(res.body.returnedAt).not.toBeNull()
  })

  it('deve retornar 403 para USER tentando devolver empréstimo de outro', async () => {
    const { adminToken, userAToken, userBToken } = await setupUsers()
    const book = await createBook(adminToken)
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString()
    const loan = await request(app).post('/loans').set('Authorization', `Bearer ${userAToken}`).send({ bookId: book.id, dueDate })
    const res = await request(app)
      .patch(`/loans/${loan.body.id}/return`)
      .set('Authorization', `Bearer ${userBToken}`)
    expect(res.status).toBe(403)
  })
})
