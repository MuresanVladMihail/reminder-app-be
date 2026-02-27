import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { getReminderRepository } from '../../repository';
import { internalError, notFound, ok } from '../../utils/http-utils';
import { ReminderMapper } from '../../mappers';
import logger from '../../utils/logger';
import { GetReminderService, ReminderNotFoundError } from './GetReminderService';

export const main: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  if (!id) return notFound('Reminder ID is required');

  try {
    const service = new GetReminderService(getReminderRepository());
    const reminder = await service.execute(id);

    return ok({ data: ReminderMapper.toPayload(reminder) });
  } catch (err) {
    if (err instanceof ReminderNotFoundError) return notFound(err.message);

    logger.error({ reminderId: id, err }, 'Unexpected error');
    return internalError();
  }
};
