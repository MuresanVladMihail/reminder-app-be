import type { ReminderStatus } from './ReminderStatus';

export interface Reminder {
  id: string;
  title: string;
  scheduledAt: string;
  status: ReminderStatus;
  createdAt: string;
  updatedAt?: string;
  sentAt?: string;
  /** EventBridge Scheduler name — stored for cancellation on delete */
  schedulerName?: string;
  /** Unix timestamp — DynamoDB TTL auto-evicts the record 24h after scheduledAt */
  ttl?: number;
}
