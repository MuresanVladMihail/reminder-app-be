import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  type QueryCommandInput,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import type { CreateReminderInput, Reminder, ReminderStatus } from '../models/internal';
import type { ReminderRepository } from './ReminderRepository';
import { Page, PageOptions } from '../models/common';

const STATUS_SCHEDULED_AT_INDEX = 'StatusScheduledAtIndex';
const TTL_OFFSET_SECONDS = 86400; // 24 h after scheduledAt
const MAX_DUE_REMINDERS = 100;

export class DynamoReminderRepository implements ReminderRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async create(input: CreateReminderInput): Promise<Reminder> {
    const now = new Date().toISOString();
    const id = uuidv4();

    // TTL: auto-expire record 24h after scheduledAt (for cleanup)
    const ttl = Math.floor(new Date(input.scheduledAt).getTime() / 1000) + TTL_OFFSET_SECONDS;

    const reminder: Reminder = {
      id,
      title: input.title,
      scheduledAt: input.scheduledAt,
      status: 'PENDING',
      createdAt: now,
      ttl,
    };

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: reminder,
        ConditionExpression: 'attribute_not_exists(id)',
      }),
    );

    return reminder;
  }

  async findById(id: string): Promise<Reminder | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );

    return (result.Item as Reminder) ?? null;
  }

  async updateStatus(
    id: string,
    status: ReminderStatus,
    extra?: { sentAt?: string; schedulerName?: string },
  ): Promise<Reminder> {
    const result = await this.client.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression:
          'SET #status = :status, updatedAt = :updatedAt' +
          (extra?.sentAt ? ', sentAt = :sentAt' : '') +
          (extra?.schedulerName ? ', schedulerName = :schedulerName' : ''),
        ExpressionAttributeNames: {
          '#status': 'status', // reserved word in DynamoDB
        },
        ExpressionAttributeValues: {
          ':status': status,
          ':updatedAt': new Date().toISOString(),
          ...(extra?.sentAt && { ':sentAt': extra.sentAt }),
          ...(extra?.schedulerName && { ':schedulerName': extra.schedulerName }),
        },
        ConditionExpression: 'attribute_exists(id)',
        ReturnValues: 'ALL_NEW',
      }),
    );

    return result.Attributes as Reminder;
  }

  async markDeleted(id: string): Promise<void> {
    await this.updateStatus(id, 'DELETED');
  }

  async listByStatus(status: ReminderStatus, options?: PageOptions): Promise<Page<Reminder>> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: STATUS_SCHEDULED_AT_INDEX,
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': status },
      Limit: options?.limit ?? 20,
      ...(options?.nextToken && {
        ExclusiveStartKey: this.decodeNextToken(options.nextToken),
      }),
    };

    const result = await this.client.send(new QueryCommand(params));

    return {
      items: (result.Items as Reminder[]) ?? [],
      nextToken: result.LastEvaluatedKey
        ? this.encodeNextToken(result.LastEvaluatedKey)
        : undefined,
    };
  }

  async listAll(options?: PageOptions): Promise<Page<Reminder>> {
    // Merge PENDING + SENT, exclude DELETED
    const [pending, sent] = await Promise.all([
      this.listByStatus('PENDING', options),
      this.listByStatus('SENT', options),
    ]);

    return {
      items: [...pending.items, ...sent.items].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
      nextToken: pending.nextToken ?? sent.nextToken,
    };
  }

  async findDueReminders(beforeDate: string): Promise<Reminder[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: STATUS_SCHEDULED_AT_INDEX,
        KeyConditionExpression: '#status = :status AND scheduledAt <= :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': 'PENDING', ':now': beforeDate },
        Limit: MAX_DUE_REMINDERS,
      }),
    );

    return (result.Items as Reminder[]) ?? [];
  }

  private encodeNextToken(key: Record<string, unknown>): string {
    return Buffer.from(JSON.stringify(key)).toString('base64');
  }

  private decodeNextToken(token: string): Record<string, unknown> {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
  }
}
