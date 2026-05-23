import { describe, it, expect, beforeAll } from 'vitest'
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

async function getUserToken() {
  await request(app).post('/auth/register').send({ name: 'User', email: 'user@test.com', password: 'user123' })
  const login = await request(app).post('/auth/login').send({ email: 'user@test.com', password: 'user123' })
  return login.body.token as string
}

describe('GET /authors', () => {
  it('deve listar autores publicamente', async () => {
    const res = await request(app).get('/authors')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
})

describe('POST /authors', () => {
  it('deve criar autor como ADMIN', async () => {
    const token = await getAdminToken()
    const res = await request(app)
      .post('/authors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Machado de Assis', bio: 'Escritor brasileiro' })
    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Machado de Assis')
  })

  it('deve retornar 403 para USER tentando criar autor', async () => {
    const token = await getUserToken()
    const res = await request(app)
      .post('/authors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Autor Qualquer' })
    expect(res.status).toBe(403)
  })

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).post('/authors').send({ name: 'Autor' })
    expect(res.status).toBe(401)
  })

  it('deve rejeitar dados inválidos', async () => {
    const token = await getAdminToken()
    const res = await request(app)
      .post('/authors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A' })
    expect(res.status).toBe(422)
  })
})

describe('GET /authors/:id', () => {
  it('deve retornar autor por ID com livros', async () => {
    const token = await getAdminToken()
    const created = await request(app)
      .post('/authors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Clarice Lispector' })
    const res = await request(app).get(`/authors/${created.body.id}`)
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Clarice Lispector')
    expect(res.body).toHaveProperty('books')
  })

  it('deve retornar 404 para ID inexistente', async () => {
    const res = await request(app).get('/authors/00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })
})

describe('PUT /authors/:id', () => {
  it('deve atualizar autor como ADMIN', async () => {
    const token = await getAdminToken()
    const created = await request(app)
      .post('/authors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Original' })
    const res = await request(app)
      .put(`/authors/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nome Atualizado' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Nome Atualizado')
  })
})

describe('DELETE /authors/:id', () => {
  it('deve deletar autor como ADMIN', async () => {
    const token = await getAdminToken()
    const created = await request(app)
      .post('/authors')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Autor Para Deletar' })
    const res = await request(app)
      .delete(`/authors/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)
  })
})
