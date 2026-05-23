import { z } from 'zod'

export const createAuthorSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  bio: z.string().optional(),
})

export const updateAuthorSchema = createAuthorSchema.partial()

export type CreateAuthorInput = z.infer<typeof createAuthorSchema>
export type UpdateAuthorInput = z.infer<typeof updateAuthorSchema>
