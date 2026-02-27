import type {ReminderRepository} from '../../repository';
import {sendReminderEmail} from '../../lib/ses';
import logger from '../../utils/logger';
import type {DispatchPayload} from '../../validation/DispatchPayloadSchema';

export class ProcessReminderService {
    constructor(private readonly repository: ReminderRepository) {
    }

    async execute(payload: DispatchPayload): Promise<void> {

        const reminder = await this.repository.findById(payload.reminderId);

        if (!reminder) {
            logger.warn({reminderId: payload.reminderId}, 'Reminder not found, skipping');
            return;
        }

        if (reminder.status !== 'PENDING') {
            logger.info(
                {reminderId: payload.reminderId, status: reminder.status},
                'Reminder already processed, skipping',
            );
            return;
        }

        const recipientEmail = process.env.RECIPIENT_EMAIL;
        const senderEmail = process.env.SENDER_EMAIL;

        if (!recipientEmail || !senderEmail) {
            throw new Error('RECIPIENT_EMAIL or SENDER_EMAIL environment variable is not set');
        }

        try {
            await sendReminderEmail({
                recipientEmail,
                senderEmail,
                reminderTitle: reminder.title,
                scheduledAt: reminder.scheduledAt,
            });
        } catch (error) {
            logger.error({err: error, reminderId: reminder.id}, 'Failed to send reminder email');
        }

        await this.repository.updateStatus(reminder.id, 'SENT', {
            sentAt: new Date().toISOString(),
        });

        logger.info({reminderId: reminder.id}, 'Successfully sent reminder');
    }
}
