import type {APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda';
import {getReminderRepository} from '../../repository';
import {created, internalError} from '../../utils/http-utils';
import {parseBody} from '../../utils/zod-utils';
import {CreateReminderSchema} from '../../validation/CreateReminderSchema';
import {ReminderMapper} from '../../mappers';
import logger from '../../utils/logger';
import {CreateReminderService} from './CreateReminderService';

export const main: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    const parsed = parseBody(CreateReminderSchema, event.body);
    if (!parsed.success) return parsed.error;

    try {
        const service = new CreateReminderService(getReminderRepository());
        const reminder = await service.execute(parsed.data);

        return created({data: ReminderMapper.toPayload(reminder)});
    } catch (err) {
        logger.error({err}, 'Unexpected error');
        return internalError();
    }
};
