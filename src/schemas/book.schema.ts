import { z } from 'zod'

export const createBookSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  isbn: z.string().min(10, 'ISBN deve ter no mínimo 10 caracteres'),
  year: z.number().int().min(1000).max(new Date().getFullYear()),
  synopsis: z.string().optional(),
  authorId: z.string().uuid('ID do autor inválido'),
})

export const updateBookSchema = createBookSchema.partial()

export type CreateBookInput = z.infer<typeof createBookSchema>
export type UpdateBookInput = z.infer<typeof updateBookSchema>
