// Jest global setup: mock environment variables for all tests

process.env.RECIPIENT_EMAIL = 'test-recipient@example.com';
process.env.SENDER_EMAIL = 'test-sender@example.com';
process.env.TABLE_NAME = 'reminders-test';
process.env.REGION = 'eu-west-1';
process.env.IS_LOCAL = 'true';
process.env.QUEUE_URL = 'http://localhost:4566/000000000000/reminders-queue-dev';
process.env.QUEUE_ARN = 'arn:aws:sqs:eu-west-1:000000000000:reminders-queue-dev';
process.env.SCHEDULER_ROLE_ARN = 'arn:aws:iam::000000000000:role/reminders-scheduler-role-dev';
process.env.SCHEDULER_GROUP_NAME = 'reminders';
