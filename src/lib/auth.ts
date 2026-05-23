import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export interface JwtPayload {
  sub: string
  email: string
  role: string
}

export function signToken(payload: JwtPayload): string {
  const secret = process.env['JWT_SECRET']
  if (!secret) throw new Error('JWT_SECRET não configurado')
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env['JWT_SECRET']
  if (!secret) throw new Error('JWT_SECRET não configurado')
  return jwt.verify(token, secret) as JwtPayload
}
