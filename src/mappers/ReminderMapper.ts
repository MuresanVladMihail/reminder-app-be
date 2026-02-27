import type { Reminder } from '../models/internal';
import type { ReminderPaginatedPayload, ReminderPayload } from '../models/external';

export class ReminderMapper {
  static toPayload(reminder: Reminder): ReminderPayload {
    return {
      id: reminder.id,
      title: reminder.title,
      scheduledAt: reminder.scheduledAt,
      status: reminder.status,
      createdAt: reminder.createdAt,
      ...(reminder.sentAt && { sentAt: reminder.sentAt }),
    };
  }

  static toPaginatedPayload(reminders: Reminder[], nextToken?: string): ReminderPaginatedPayload {
    return {
      data: reminders.map(ReminderMapper.toPayload),
      pagination: {
        count: reminders.length,
        ...(nextToken && { nextToken }),
      },
    };
  }
}
