import {z} from 'zod';

export const ListRemindersQuerySchema = z.object({
    status: z.enum(['PENDING', 'SENT', 'DELETED']).optional(),
    limit: z
        .string()
        .optional()
        .transform((v) => (v ? parseInt(v, 10) : 20))
        .pipe(z.number().min(1).max(100)),
    nextToken: z.string().optional(),
});

export type ListRemindersQuery = z.infer<typeof ListRemindersQuerySchema>;
