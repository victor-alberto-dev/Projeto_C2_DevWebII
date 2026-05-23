import { execSync } from 'node:child_process'
import { rm } from 'node:fs/promises'

export async function setup() {
  try { await rm('./prisma/test.db', { force: true }) } catch {}
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
    stdio: 'pipe',
  })
}