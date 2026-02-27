# Reminders App

Serverless email reminder scheduling service built with AWS Lambda, DynamoDB, SES, and EventBridge Scheduler.

## Quick Start

```bash
npm install

npm run local:infra    # start DynamoDB Local + LocalStack
npm run local:dev      # start API on http://localhost:3000
```

DynamoDB Admin UI available at `http://localhost:8001`.

---

## API

| Method   | Path              | Description                                 |
|----------|-------------------|---------------------------------------------|
| `POST`   | `/reminders`      | Schedule a new reminder                     |
| `GET`    | `/reminders`      | List reminders (`?status=PENDING&limit=20`) |
| `GET`    | `/reminders/{id}` | Get a single reminder                       |
| `DELETE` | `/reminders/{id}` | Cancel a reminder                           |

---

## Architecture

**Production** — EventBridge Scheduler fires a one-time trigger at `scheduledAt`, delivers to SQS, which invokes
`processReminder` Lambda to send via SES.

**Local** — `localSchedulerPoller` (1-min cron) replaces EventBridge by polling DynamoDB for due reminders and invoking
`processReminder` directly. EventBridge Scheduler is not available in LocalStack free tier.

---

## Tests

```bash
npm test
npm run test:watch
npm run test:coverage
```

---

## Deploy

```bash
npm run deploy        # dev
npm run deploy:prod   # production
```
