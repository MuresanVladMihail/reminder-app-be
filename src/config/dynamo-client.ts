import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export function getDynamoClient(): DynamoDBDocumentClient {
  const isLocal = process.env.IS_LOCAL === 'true';

  const client = new DynamoDBClient({
    region: process.env.REGION ?? 'eu-west-1',
    ...(isLocal && {
      endpoint: process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000',
      credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
    }),
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false },
  });
}
