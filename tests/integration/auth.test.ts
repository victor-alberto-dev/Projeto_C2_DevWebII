import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'

const app = createApp()

describe('POST /auth/register', () => {
  it('deve registrar um novo usuário com sucesso', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Maria Silva',
      email: 'maria@test.com',
      password: 'senha123',
    })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.email).toBe('maria@test.com')
    expect(res.body).not.toHaveProperty('password')
  })

  it('deve rejeitar e-mail duplicado', async () => {
    await request(app).post('/auth/register').send({
      name: 'Maria Silva',
      email: 'duplicado@test.com',
      password: 'senha123',
    })
    const res = await request(app).post('/auth/register').send({
      name: 'Maria Silva 2',
      email: 'duplicado@test.com',
      password: 'senha456',
    })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  it('deve rejeitar dados inválidos (senha curta)', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Maria',
      email: 'maria2@test.com',
      password: '123',
    })
    expect(res.status).toBe(422)
  })
})

describe('POST /auth/login', () => {
  it('deve logar com sucesso e retornar token', async () => {
    await request(app).post('/auth/register').send({
      name: 'João Login',
      email: 'joao@test.com',
      password: 'senha123',
    })
    const res = await request(app).post('/auth/login').send({
      email: 'joao@test.com',
      password: 'senha123',
    })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body).not.toHaveProperty('password')
  })

  it('deve rejeitar credenciais inválidas', async () => {
    const res = await request(app).post('/auth/login').send({
      email: 'inexistente@test.com',
      password: 'qualquer',
    })
    expect(res.status).toBe(401)
  })

  it('deve rejeitar senha errada', async () => {
    await request(app).post('/auth/register').send({
      name: 'Teste',
      email: 'teste@test.com',
      password: 'correta123',
    })
    const res = await request(app).post('/auth/login').send({
      email: 'teste@test.com',
      password: 'errada999',
    })
    expect(res.status).toBe(401)
  })
})

describe('GET /auth/me', () => {
  it('deve retornar dados do usuário autenticado', async () => {
    await request(app).post('/auth/register').send({
      name: 'User Me',
      email: 'me@test.com',
      password: 'senha123',
    })
    const login = await request(app).post('/auth/login').send({
      email: 'me@test.com',
      password: 'senha123',
    })
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`)
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('me@test.com')
    expect(res.body).not.toHaveProperty('password')
  })

  it('deve retornar 401 sem token', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })
})
