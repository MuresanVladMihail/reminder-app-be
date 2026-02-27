import type {Context, SQSBatchResponse, SQSEvent, SQSRecord} from 'aws-lambda';
import {main} from '@/functions/processReminder/handler';

export const FIXED_DATE = '2025-06-15T10:00:00.000Z';

export const pendingReminder = {
    id: 'reminder-abc',
    title: 'Doctor appointment',
    scheduledAt: FIXED_DATE,
    status: 'PENDING' as const,
    createdAt: FIXED_DATE,
};

export const dispatchPayload = {
    reminderId: 'reminder-abc',
    title: 'Doctor appointment',
    scheduledAt: FIXED_DATE,
};

export function makeSQSRecord(body: object, messageId = 'msg-1'): SQSRecord {
    return {
        messageId,
        receiptHandle: 'handle-1',
        body: JSON.stringify(body),
        attributes: {} as never,
        messageAttributes: {},
        md5OfBody: '',
        eventSource: 'aws:sqs',
        eventSourceARN: 'arn:aws:sqs:eu-west-1:123456789012:reminders-queue-dev',
        awsRegion: 'eu-west-1',
    };
}

export function makeSQSEvent(records: SQSRecord[]): SQSEvent {
    return {Records: records};
}

export async function invokeHandler(event: SQSEvent): Promise<SQSBatchResponse> {
    return (await main(event, {} as Context, jest.fn())) as SQSBatchResponse;
}
