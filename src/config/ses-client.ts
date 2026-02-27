import { SESClient } from '@aws-sdk/client-ses';

export function getSESClient(): SESClient {
  const isLocal = process.env.IS_LOCAL === 'true';

  return new SESClient({
    region: process.env.REGION ?? 'eu-west-1',
    ...(isLocal && {
      endpoint: process.env.AWS_ENDPOINT_URL ?? 'http://localhost:4566',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    }),
  });
}
