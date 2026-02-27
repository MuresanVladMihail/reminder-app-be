import type { ReminderRepository } from '../../repository';
import type { Reminder } from '../../models/internal';
import { ReminderNotFoundError } from '../../errors/ReminderErrors';

export { ReminderNotFoundError };

export class GetReminderService {
  constructor(private readonly repository: ReminderRepository) {}

  async execute(id: string): Promise<Reminder> {
    const reminder = await this.repository.findById(id);

    if (!reminder || reminder.status === 'DELETED') {
      throw new ReminderNotFoundError();
    }

    return reminder;
  }
}
