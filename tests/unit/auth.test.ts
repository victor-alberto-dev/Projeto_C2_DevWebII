import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, signToken, verifyToken } from '../../src/lib/auth.js'

describe('hashPassword', () => {
  it('deve gerar hash diferente da senha original', async () => {
    const hash = await hashPassword('senha123')
    expect(hash).not.toBe('senha123')
  })

  it('deve gerar hashes diferentes para a mesma senha', async () => {
    const hash1 = await hashPassword('senha123')
    const hash2 = await hashPassword('senha123')
    expect(hash1).not.toBe(hash2)
  })
})

describe('verifyPassword', () => {
  it('deve retornar true para senha correta', async () => {
    const hash = await hashPassword('minhaSenha')
    const result = await verifyPassword('minhaSenha', hash)
    expect(result).toBe(true)
  })

  it('deve retornar false para senha incorreta', async () => {
    const hash = await hashPassword('minhaSenha')
    const result = await verifyPassword('senhaErrada', hash)
    expect(result).toBe(false)
  })
})

describe('signToken / verifyToken', () => {
  const payload = { sub: 'user-id-123', email: 'user@test.com', role: 'USER' }

  it('deve assinar e verificar token corretamente', () => {
    const token = signToken(payload)
    const decoded = verifyToken(token)
    expect(decoded.sub).toBe(payload.sub)
    expect(decoded.email).toBe(payload.email)
    expect(decoded.role).toBe(payload.role)
  })

  it('deve lançar erro para token inválido', () => {
    expect(() => verifyToken('token.invalido.aqui')).toThrow()
  })

  it('deve gerar token como string não vazia', () => {
    const token = signToken(payload)
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })
})
