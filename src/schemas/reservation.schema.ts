import { z } from 'zod'

export const createReservationSchema = z.object({
  bookId: z.string().uuid('ID do livro inválido'),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>
