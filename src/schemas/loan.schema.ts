import { z } from 'zod'

export const createLoanSchema = z.object({
  bookId: z.string().uuid('ID do livro inválido'),
  dueDate: z.string().datetime({ message: 'Data de devolução inválida (use ISO 8601)' }),
})

export type CreateLoanInput = z.infer<typeof createLoanSchema>
