import { SchedulerClient } from '@aws-sdk/client-scheduler';

export function getSchedulerClient(): SchedulerClient {
  return new SchedulerClient({
    region: process.env.REGION ?? 'eu-west-1',
  });
}
