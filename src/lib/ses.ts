import { SendEmailCommand } from '@aws-sdk/client-ses';
import { getSESClient } from '../config/ses-client';
import type { SendReminderEmailInput } from '../models/internal';
import { buildHtmlBody, buildSubject, buildTextBody } from '../templates/reminder-email.template';

export async function sendReminderEmail(input: SendReminderEmailInput): Promise<void> {
  const client = getSESClient();

  await client.send(
    new SendEmailCommand({
      Source: input.senderEmail,
      Destination: {
        ToAddresses: [input.recipientEmail],
      },
      Message: {
        Subject: {
          Data: buildSubject(input.reminderTitle),
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: buildTextBody(input.reminderTitle, input.scheduledAt),
            Charset: 'UTF-8',
          },
          Html: {
            Data: buildHtmlBody(input.reminderTitle, input.scheduledAt),
            Charset: 'UTF-8',
          },
        },
      },
    }),
  );
}
