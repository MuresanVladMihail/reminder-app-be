import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { getReminderRepository } from '../../repository';
import { internalError, ok } from '../../utils/http-utils';
import { parseQuery } from '../../utils/zod-utils';
import { ListRemindersQuerySchema } from '../../validation/ListRemindersQuerySchema';
import { ReminderMapper } from '../../mappers';
import logger from '../../utils/logger';
import { ListRemindersService } from './ListRemindersService';

export const main: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const parsed = parseQuery(
    ListRemindersQuerySchema,
    event.queryStringParameters as Record<string, string | undefined> | null,
  );
  if (!parsed.success) return parsed.error;

  try {
    const service = new ListRemindersService(getReminderRepository());
    const result = await service.execute(parsed.data);

    return ok(ReminderMapper.toPaginatedPayload(result.items, result.nextToken));
  } catch (err) {
    logger.error({ err }, 'Unexpected error');
    return internalError();
  }
};
