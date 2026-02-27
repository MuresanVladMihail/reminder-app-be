import { getDynamoClient } from '../config/dynamo-client';
import { DynamoReminderRepository } from './DynamoReminderRepository';
import type { ReminderRepository } from './ReminderRepository';

export type { ReminderRepository };
export { DynamoReminderRepository };

let _repository: ReminderRepository | null = null;

export function getReminderRepository(): ReminderRepository {
  if (!_repository) {
    _repository = new DynamoReminderRepository(
      getDynamoClient(),
      process.env.TABLE_NAME ?? 'reminders-dev',
    );
  }
  return _repository;
}

export function setReminderRepository(repo: ReminderRepository): void {
  _repository = repo;
}
