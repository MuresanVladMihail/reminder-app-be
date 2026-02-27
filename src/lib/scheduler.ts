import {
  CreateScheduleCommand,
  DeleteScheduleCommand,
  FlexibleTimeWindowMode,
} from '@aws-sdk/client-scheduler';
import { getSchedulerClient } from '../config/scheduler-client';
import type { CreateReminderScheduleInput } from '../models/internal';

// EventBridge Scheduler expects: at(2026-06-01T10:00:00) — no milliseconds, no Z
function toSchedulerAtExpression(isoDate: string): string {
  const withoutMilliseconds = new Date(isoDate).toISOString().slice(0, 19);
  return `at(${withoutMilliseconds})`;
}

export async function createReminderSchedule(input: CreateReminderScheduleInput): Promise<string> {
  const client = getSchedulerClient();
  const schedulerName = `reminder-${input.reminderId}`;

  await client.send(
    new CreateScheduleCommand({
      Name: schedulerName,
      GroupName: process.env.SCHEDULER_GROUP_NAME ?? 'reminders',
      ScheduleExpression: toSchedulerAtExpression(input.scheduledAt),
      ScheduleExpressionTimezone: 'UTC',
      FlexibleTimeWindow: { Mode: FlexibleTimeWindowMode.OFF },
      Target: {
        Arn: input.queueArn,
        RoleArn: input.schedulerRoleArn,
        Input: JSON.stringify({
          reminderId: input.reminderId,
          title: input.title,
          scheduledAt: input.scheduledAt,
        }),
      },
      ActionAfterCompletion: 'DELETE',
    }),
  );

  return schedulerName;
}

export async function deleteReminderSchedule(schedulerName: string): Promise<void> {
  const client = getSchedulerClient();

  try {
    await client.send(
      new DeleteScheduleCommand({
        Name: schedulerName,
        GroupName: process.env.SCHEDULER_GROUP_NAME ?? 'reminders',
      }),
    );
  } catch (err: unknown) {
    const awsErr = err as { name?: string };
    if (awsErr?.name === 'ResourceNotFoundException') return;
    throw err;
  }
}
