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
    .send({ name: 'Autor Reserva' })
  const book = await request(app)
    .post('/books')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ title: 'Livro Reserva', isbn: '978-3-16-148410-0', year: 2022, authorId: author.body.id })
  return book.body
}

describe('POST /reservations', () => {
  it('deve criar reserva com sucesso', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const book = await createBook(adminToken)
    const res = await request(app)
      .post('/reservations')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ bookId: book.id })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('PENDING')
  })

  it('deve impedir reserva duplicada pendente', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const book = await createBook(adminToken)
    await request(app).post('/reservations').set('Authorization', `Bearer ${userAToken}`).send({ bookId: book.id })
    const res = await request(app)
      .post('/reservations')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ bookId: book.id })
    expect(res.status).toBe(400)
  })

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).post('/reservations').send({ bookId: '00000000-0000-0000-0000-000000000000' })
    expect(res.status).toBe(401)
  })
})

describe('DELETE /reservations/:id (cancelamento com controle de propriedade)', () => {
  it('dono pode cancelar sua própria reserva', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const book = await createBook(adminToken)
    const reservation = await request(app)
      .post('/reservations')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ bookId: book.id })
    const res = await request(app)
      .delete(`/reservations/${reservation.body.id}`)
      .set('Authorization', `Bearer ${userAToken}`)
    expect(res.status).toBe(204)
  })

  it('USER não pode cancelar reserva de outro USER - retorna 403', async () => {
    const { adminToken, userAToken, userBToken } = await setupUsers()
    const book = await createBook(adminToken)
    const reservation = await request(app)
      .post('/reservations')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ bookId: book.id })
    const res = await request(app)
      .delete(`/reservations/${reservation.body.id}`)
      .set('Authorization', `Bearer ${userBToken}`)
    expect(res.status).toBe(403)
  })

  it('ADMIN pode cancelar qualquer reserva', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const book = await createBook(adminToken)
    const reservation = await request(app)
      .post('/reservations')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ bookId: book.id })
    const res = await request(app)
      .delete(`/reservations/${reservation.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)
  })
})

describe('PATCH /reservations/:id/confirm', () => {
  it('ADMIN pode confirmar reserva pendente', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const book = await createBook(adminToken)
    const reservation = await request(app)
      .post('/reservations')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ bookId: book.id })
    const res = await request(app)
      .patch(`/reservations/${reservation.body.id}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('CONFIRMED')
  })

  it('USER não pode confirmar reserva - retorna 403', async () => {
    const { adminToken, userAToken } = await setupUsers()
    const book = await createBook(adminToken)
    const reservation = await request(app)
      .post('/reservations')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ bookId: book.id })
    const res = await request(app)
      .patch(`/reservations/${reservation.body.id}/confirm`)
      .set('Authorization', `Bearer ${userAToken}`)
    expect(res.status).toBe(403)
  })
})
