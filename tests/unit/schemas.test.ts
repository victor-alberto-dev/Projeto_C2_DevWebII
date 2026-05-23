import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema } from '../../src/schemas/auth.schema.js'
import { createAuthorSchema } from '../../src/schemas/author.schema.js'
import { createBookSchema } from '../../src/schemas/book.schema.js'
import { createLoanSchema } from '../../src/schemas/loan.schema.js'
import { createReservationSchema } from '../../src/schemas/reservation.schema.js'

describe('registerSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = registerSchema.safeParse({
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'senha123',
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar e-mail inválido', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'nao-é-email',
      password: 'senha123',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar senha curta', () => {
    const result = registerSchema.safeParse({
      name: 'João',
      email: 'joao@email.com',
      password: '123',
    })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar nome muito curto', () => {
    const result = registerSchema.safeParse({
      name: 'J',
      email: 'joao@email.com',
      password: 'senha123',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = loginSchema.safeParse({ email: 'user@test.com', password: 'senha' })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar sem e-mail', () => {
    const result = loginSchema.safeParse({ password: 'senha123' })
    expect(result.success).toBe(false)
  })
})

describe('createAuthorSchema', () => {
  it('deve aceitar nome válido', () => {
    const result = createAuthorSchema.safeParse({ name: 'Machado de Assis' })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar nome vazio', () => {
    const result = createAuthorSchema.safeParse({ name: 'J' })
    expect(result.success).toBe(false)
  })
})

describe('createBookSchema', () => {
  const validBook = {
    title: 'Dom Casmurro',
    isbn: '978-85-359-0277-5',
    year: 1899,
    authorId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  }

  it('deve aceitar dados válidos', () => {
    const result = createBookSchema.safeParse(validBook)
    expect(result.success).toBe(true)
  })

  it('deve rejeitar ISBN curto', () => {
    const result = createBookSchema.safeParse({ ...validBook, isbn: '123' })
    expect(result.success).toBe(false)
  })

  it('deve rejeitar authorId inválido (não UUID)', () => {
    const result = createBookSchema.safeParse({ ...validBook, authorId: 'nao-uuid' })
    expect(result.success).toBe(false)
  })
})

describe('createLoanSchema', () => {
  it('deve aceitar dados válidos', () => {
    const result = createLoanSchema.safeParse({
      bookId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar bookId inválido', () => {
    const result = createLoanSchema.safeParse({ bookId: 'nao-uuid', dueDate: new Date().toISOString() })
    expect(result.success).toBe(false)
  })
})

describe('createReservationSchema', () => {
  it('deve aceitar bookId UUID válido', () => {
    const result = createReservationSchema.safeParse({ bookId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
    expect(result.success).toBe(true)
  })

  it('deve rejeitar bookId inválido', () => {
    const result = createReservationSchema.safeParse({ bookId: 'invalido' })
    expect(result.success).toBe(false)
  })
})
