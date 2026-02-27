import type { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { getReminderRepository } from '../../repository';
import { conflict, internalError, noContent, notFound } from '../../utils/http-utils';
import logger from '../../utils/logger';
import { DeleteReminderService, ReminderNotFoundError, ReminderAlreadySentError } from './DeleteReminderService';

export const main: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.id;
  if (!id) return notFound('Reminder ID is required');

  try {
    const service = new DeleteReminderService(getReminderRepository());
    await service.execute(id);

    return noContent();
  } catch (err) {
    if (err instanceof ReminderNotFoundError) return notFound(err.message);
    if (err instanceof ReminderAlreadySentError) return conflict(err.message);

    logger.error({ reminderId: id, err }, 'Unexpected error');
    return internalError();
  }
};
