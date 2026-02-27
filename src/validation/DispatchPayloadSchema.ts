import { z } from 'zod';

export const DispatchPayloadSchema = z.object({
  reminderId: z.string().min(1),
  title: z.string(),
  scheduledAt: z.string(),
});

export type DispatchPayload = z.infer<typeof DispatchPayloadSchema>;
