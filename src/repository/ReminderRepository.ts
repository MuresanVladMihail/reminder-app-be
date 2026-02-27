import type { CreateReminderInput, Reminder, ReminderStatus } from '../models/internal';
import type { Page, PageOptions } from '../models/common';

export interface ReminderRepository {
  create(input: CreateReminderInput): Promise<Reminder>;

  findById(id: string): Promise<Reminder | null>;

  updateStatus(
    id: string,
    status: ReminderStatus,
    extra?: { sentAt?: string; schedulerName?: string },
  ): Promise<Reminder>;

  markDeleted(id: string): Promise<void>;

  listByStatus(status: ReminderStatus, options?: PageOptions): Promise<Page<Reminder>>;

  listAll(options?: PageOptions): Promise<Page<Reminder>>;

  findDueReminders(beforeDate: string): Promise<Reminder[]>;
}
