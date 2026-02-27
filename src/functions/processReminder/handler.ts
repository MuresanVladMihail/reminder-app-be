import type { SQSBatchResponse, SQSHandler } from 'aws-lambda';
import { getReminderRepository } from '../../repository';
import logger from '../../utils/logger';
import { ProcessReminderService } from './ProcessReminderService';
import { DispatchPayloadSchema } from '../../validation/DispatchPayloadSchema';

/**
 * SQS consumer triggered by EventBridge Scheduler (production) or the
 * localSchedulerPoller (local dev).
 *
 * Uses ReportBatchItemFailures so only failed messages are retried — successful
 * ones in the same batch are NOT re-processed.
 */
export const main: SQSHandler = async (event): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];
  const service = new ProcessReminderService(getReminderRepository());

  await Promise.all(
    event.Records.map(async (record) => {
      try {
        let body: unknown;
        try {
          body = JSON.parse(record.body);
        } catch {
          throw new Error(`Malformed JSON in SQS message body: ${record.body}`);
        }

        const payload = DispatchPayloadSchema.parse(body);
        await service.execute(payload);
      } catch (err) {
        logger.error({ messageId: record.messageId, err }, 'Failed to process message');
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }),
  );

  return { batchItemFailures };
};
