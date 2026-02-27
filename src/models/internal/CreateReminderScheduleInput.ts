export interface CreateReminderScheduleInput {
  reminderId: string;
  title: string;
  scheduledAt: string;
  queueArn: string;
  schedulerRoleArn: string;
}
