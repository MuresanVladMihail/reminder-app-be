import {z} from 'zod';
import type {APIGatewayProxyResult} from 'aws-lambda';
import {badRequest} from './http-utils';

export interface ZodSuccess<T> {
    success: true;
    data: T;
}

export interface ZodFailure {
    success: false;
    error: APIGatewayProxyResult;
}

export function zodSuccessFrom<T>(data: T): ZodSuccess<T> {
    return {success: true, data};
}

export function zodFailureFrom(error: APIGatewayProxyResult): ZodFailure {
    return {success: false, error};
}

export function parseBody<T>(schema: z.ZodType<T>, body: string | null): ZodSuccess<T> | ZodFailure {
    if (!body) {
        return zodFailureFrom(badRequest('Request body is required'))
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(body);
    } catch {
        return zodFailureFrom(badRequest('Invalid JSON body'));
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
        const details = result.error.flatten().fieldErrors;
        return zodFailureFrom(badRequest('Validation failed', details as Record<string, unknown>))
    }

    return zodSuccessFrom(result.data)
}

export function parseQuery<T>(schema: z.ZodType<T>, params: Record<string, string | undefined> | null): ZodSuccess<T> | ZodFailure {
    const result = schema.safeParse(params ?? {});
    if (!result.success) {
        const details = result.error.flatten().fieldErrors;
        return zodFailureFrom(badRequest('Invalid query parameters', details as Record<string, unknown>));
    }
    return zodSuccessFrom(result.data)
}
