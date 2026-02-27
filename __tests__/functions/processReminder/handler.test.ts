import { getReminderRepository, type ReminderRepository } from '@/repository';
import { sendReminderEmail } from '@/lib/ses';
import {
    dispatchPayload,
    invokeHandler,
    makeSQSEvent,
    makeSQSRecord,
    pendingReminder,
} from './fixtures';

jest.mock('@/repository', () => ({
    getReminderRepository: jest.fn(),
}));

jest.mock('@/lib/ses', () => ({
    sendReminderEmail: jest.fn(),
}));

const mockRepository: jest.Mocked<ReminderRepository> = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
    create: jest.fn(),
    markDeleted: jest.fn(),
    listByStatus: jest.fn(),
    listAll: jest.fn(),
    findDueReminders: jest.fn(),
};

const mockSendEmail = sendReminderEmail as jest.MockedFunction<typeof sendReminderEmail>;

describe('processReminder handler', () => {
    beforeEach(() => {
        (getReminderRepository as jest.Mock).mockReturnValue(mockRepository);
    });

    describe('happy path', () => {
        it('sends email and marks reminder as SENT', async () => {
            mockRepository.findById.mockResolvedValue(pendingReminder);
            mockSendEmail.mockResolvedValue(undefined);
            mockRepository.updateStatus.mockResolvedValue({ ...pendingReminder, status: 'SENT' });

            const result = await invokeHandler(makeSQSEvent([makeSQSRecord(dispatchPayload)]));

            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    recipientEmail: 'test-recipient@example.com',
                    senderEmail: 'test-sender@example.com',
                    reminderTitle: 'Doctor appointment',
                }),
            );
            expect(mockRepository.updateStatus).toHaveBeenCalledWith(
                'reminder-abc',
                'SENT',
                expect.objectContaining({ sentAt: expect.any(String) }),
            );
            expect(result.batchItemFailures).toHaveLength(0);
        });

        it('processes a batch of multiple messages', async () => {
            mockRepository.findById.mockResolvedValue(pendingReminder);
            mockSendEmail.mockResolvedValue(undefined);
            mockRepository.updateStatus.mockResolvedValue({ ...pendingReminder, status: 'SENT' });

            const records = [
                makeSQSRecord({ ...dispatchPayload, reminderId: 'r-1' }, 'msg-1'),
                makeSQSRecord({ ...dispatchPayload, reminderId: 'r-2' }, 'msg-2'),
                makeSQSRecord({ ...dispatchPayload, reminderId: 'r-3' }, 'msg-3'),
            ];

            const result = await invokeHandler(makeSQSEvent(records));

            expect(mockSendEmail).toHaveBeenCalledTimes(3);
            expect(result.batchItemFailures).toHaveLength(0);
        });
    });

    describe('idempotency', () => {
        it('skips sending if reminder is already SENT (duplicate SQS delivery)', async () => {
            mockRepository.findById.mockResolvedValue({ ...pendingReminder, status: 'SENT' });

            const result = await invokeHandler(makeSQSEvent([makeSQSRecord(dispatchPayload)]));

            expect(mockSendEmail).not.toHaveBeenCalled();
            expect(mockRepository.updateStatus).not.toHaveBeenCalled();
            expect(result.batchItemFailures).toHaveLength(0);
        });

        it('skips sending if reminder is DELETED', async () => {
            mockRepository.findById.mockResolvedValue({ ...pendingReminder, status: 'DELETED' });

            const result = await invokeHandler(makeSQSEvent([makeSQSRecord(dispatchPayload)]));

            expect(mockSendEmail).not.toHaveBeenCalled();
            expect(result.batchItemFailures).toHaveLength(0);
        });

        it('skips silently if reminder no longer exists', async () => {
            mockRepository.findById.mockResolvedValue(null);

            const result = await invokeHandler(makeSQSEvent([makeSQSRecord(dispatchPayload)]));

            expect(mockSendEmail).not.toHaveBeenCalled();
            expect(result.batchItemFailures).toHaveLength(0);
        });
    });

    describe('partial batch failures', () => {
        it('reports only the failed message, not the successful ones', async () => {
            mockRepository.findById.mockResolvedValue(pendingReminder);
            mockSendEmail
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error('SES throttled'));
            mockRepository.updateStatus.mockResolvedValue({ ...pendingReminder, status: 'SENT' });

            const records = [
                makeSQSRecord(dispatchPayload, 'msg-1'),
                makeSQSRecord(dispatchPayload, 'msg-2'),
            ];

            const result = await invokeHandler(makeSQSEvent(records));

            expect(result.batchItemFailures).toHaveLength(1);
            expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-2');
        });

        it('reports all messages as failed if DynamoDB is down', async () => {
            mockRepository.findById.mockRejectedValue(new Error('DynamoDB connection failed'));

            const records = [
                makeSQSRecord(dispatchPayload, 'msg-1'),
                makeSQSRecord(dispatchPayload, 'msg-2'),
            ];

            const result = await invokeHandler(makeSQSEvent(records));

            expect(result.batchItemFailures).toHaveLength(2);
        });

        it('reports message as failed when SQS body is malformed JSON', async () => {
            const badRecord = { ...makeSQSRecord({}), body: 'not-valid-json', messageId: 'msg-malformed' };

            const result = await invokeHandler(makeSQSEvent([badRecord]));

            expect(result.batchItemFailures).toHaveLength(1);
            expect(result.batchItemFailures[0].itemIdentifier).toBe('msg-malformed');
        });

        it('reports message as failed when RECIPIENT_EMAIL is not configured', async () => {
            const original = process.env.RECIPIENT_EMAIL;
            delete process.env.RECIPIENT_EMAIL;

            mockRepository.findById.mockResolvedValue(pendingReminder);

            try {
                const result = await invokeHandler(makeSQSEvent([makeSQSRecord(dispatchPayload)]));
                expect(result.batchItemFailures).toHaveLength(1);
            } finally {
                process.env.RECIPIENT_EMAIL = original;
            }
        });
    });
});
