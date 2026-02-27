import type {ScheduledHandler} from 'aws-lambda';
import {getReminderRepository} from '../../repository';
import {ProcessReminderService} from '../processReminder/ProcessReminderService';
import type { DispatchPayload } from '../../validation/DispatchPayloadSchema';
import logger from '../../utils/logger';

/**
 * LOCAL DEVELOPMENT ONLY — not invoked in production.
 *
 * Runs on a 1-minute cron via serverless-offline and mimics what EventBridge
 * Scheduler does in production: finds PENDING reminders whose scheduledAt has
 * passed and invokes ProcessReminderService directly (no SQS needed locally).
 *
 * In production this function is still deployed but its schedule is disabled
 * (enabled: false), so it incurs zero cost.
 */
export const main: ScheduledHandler = async () => {
    const now = new Date().toISOString();

    logger.info({now}, 'Polling for due reminders');

    const repository = getReminderRepository();
    const reminders = await repository.findDueReminders(now);

    if (reminders.length === 0) {
        logger.info('No due reminders');
        return;
    }

    logger.info({count: reminders.length}, 'Processing due reminders');

    const service = new ProcessReminderService(repository);
    const failures: string[] = [];

    await Promise.all(
        reminders.map(async (reminder) => {
            try {
                const payload: DispatchPayload = {
                    reminderId: reminder.id,
                    title: reminder.title,
                    scheduledAt: reminder.scheduledAt,
                };
                await service.execute(payload);
            } catch {
                failures.push(reminder.id);
            }
        }),
    );

    if (failures.length) {
        logger.error({failures}, 'Some reminders failed to process');
    }
};
