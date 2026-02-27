import type {ReminderRepository} from '../../repository';
import {deleteReminderSchedule} from '../../lib/scheduler';
import {ReminderNotFoundError, ReminderAlreadySentError} from '../../errors/ReminderErrors';

export {ReminderNotFoundError, ReminderAlreadySentError};

export class DeleteReminderService {
    constructor(private readonly repository: ReminderRepository) {
    }

    async execute(id: string): Promise<void> {
        const reminder = await this.repository.findById(id);

        if (!reminder || reminder.status === 'DELETED') {
            throw new ReminderNotFoundError();
        }

        if (reminder.status === 'SENT') {
            throw new ReminderAlreadySentError();
        }

        const isLocal = process.env.IS_LOCAL === 'true';
        if (!isLocal && reminder.schedulerName) {
            await deleteReminderSchedule(reminder.schedulerName);
        }

        await this.repository.markDeleted(id);
    }
}
