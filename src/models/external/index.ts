export type { components, operations } from './generated';

import type { components } from './generated';

export type ReminderStatus = components['schemas']['ReminderStatus'];
export type CreateReminderPayload = components['schemas']['CreateReminderRequest'];
export type ReminderPayload = components['schemas']['Reminder'];
export type ReminderPaginatedPayload = components['schemas']['ListRemindersResponse'];
export type ErrorPayload = components['schemas']['ErrorResponse'];
