export class ReminderNotFoundError extends Error {
  constructor() {
    super('Reminder not found');
    this.name = 'ReminderNotFoundError';
  }
}

export class ReminderAlreadySentError extends Error {
  constructor() {
    super('Cannot delete a reminder that has already been sent');
    this.name = 'ReminderAlreadySentError';
  }
}
