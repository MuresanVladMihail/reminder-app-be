import { z } from 'zod';

const MIN_SCHEDULE_DELAY_MS = 60_000; // at least 1 minute in the future

export const CreateReminderSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(500, 'Title cannot exceed 500 characters')
    .trim(),
  scheduledAt: z
    .string()
    .datetime({ message: 'scheduledAt must be a valid ISO 8601 UTC datetime' })
    .refine(
      (val) => new Date(val).getTime() > Date.now() + MIN_SCHEDULE_DELAY_MS,
      'scheduledAt must be at least 1 minute in the future',
    ),
});

export type CreateReminderRequest = z.infer<typeof CreateReminderSchema>;
