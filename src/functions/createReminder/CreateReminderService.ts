import type { ReminderRepository } from '../../repository';
import { createReminderSchedule } from '../../lib/scheduler';
import type { Reminder } from '../../models/internal';

export interface CreateReminderInput {
  title: string;
  scheduledAt: string;
}

export class CreateReminderService {
  constructor(private readonly repository: ReminderRepository) {}

  async execute(input: CreateReminderInput): Promise<Reminder> {
    const reminder = await this.repository.create(input);

    const isLocal = process.env.IS_LOCAL === 'true';

    if (!isLocal) {
      const schedulerName = await createReminderSchedule({
        reminderId: reminder.id,
        title: input.title,
        scheduledAt: input.scheduledAt,
        queueArn: process.env.QUEUE_ARN!,
        schedulerRoleArn: process.env.SCHEDULER_ROLE_ARN!,
      });

      await this.repository.updateStatus(reminder.id, 'PENDING', { schedulerName });
    }

    return reminder;
  }
}
