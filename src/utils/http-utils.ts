import type { APIGatewayProxyResult } from 'aws-lambda';
import type { ErrorPayload } from '../models/external';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

// ─── Response builders ─────────────────────────────────────────────────────

export function ok<T>(body: T, statusCode = 200): APIGatewayProxyResult {
  return { statusCode, headers: defaultHeaders, body: JSON.stringify(body) };
}

export function created<T>(body: T): APIGatewayProxyResult {
  return ok(body, 201);
}

export function noContent(): APIGatewayProxyResult {
  return { statusCode: 204, headers: defaultHeaders, body: '' };
}

export function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): APIGatewayProxyResult {
  const body: ErrorPayload = {
    error: { code, message, ...(details && { details }) },
  };
  return { statusCode, headers: defaultHeaders, body: JSON.stringify(body) };
}

export function badRequest(message: string, details?: Record<string, unknown>) {
  return errorResponse(400, 'VALIDATION_ERROR', message, details);
}

export function notFound(message = 'Resource not found') {
  return errorResponse(404, 'NOT_FOUND', message);
}

export function conflict(message: string) {
  return errorResponse(409, 'CONFLICT', message);
}

export function internalError(message = 'Internal server error') {
  return errorResponse(500, 'INTERNAL_ERROR', message);
}
