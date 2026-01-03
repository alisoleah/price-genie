/**
 * Error handling utilities for tRPC procedures
 * Provides consistent error responses and logging
 */

import { TRPCError } from '@trpc/server';

/**
 * Standard error codes and messages
 */
export const ErrorCodes = {
  // Client errors (4xx)
  INVALID_INPUT: {
    code: 'BAD_REQUEST' as const,
    message: 'Invalid input provided',
  },
  NOT_FOUND: {
    code: 'NOT_FOUND' as const,
    message: 'Resource not found',
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED' as const,
    message: 'Authentication required',
  },
  FORBIDDEN: {
    code: 'FORBIDDEN' as const,
    message: 'Insufficient permissions',
  },
  RATE_LIMITED: {
    code: 'TOO_MANY_REQUESTS' as const,
    message: 'Rate limit exceeded. Please try again later.',
  },
  
  // Server errors (5xx)
  INTERNAL_ERROR: {
    code: 'INTERNAL_SERVER_ERROR' as const,
    message: 'An internal error occurred',
  },
  DATABASE_ERROR: {
    code: 'INTERNAL_SERVER_ERROR' as const,
    message: 'Database operation failed',
  },
  EXTERNAL_SERVICE_ERROR: {
    code: 'INTERNAL_SERVER_ERROR' as const,
    message: 'External service unavailable',
  },
};

/**
 * Create a standardized TRPC error
 */
export function createError(
  errorType: keyof typeof ErrorCodes,
  customMessage?: string,
  cause?: unknown
): TRPCError {
  const errorConfig = ErrorCodes[errorType];
  
  return new TRPCError({
    code: errorConfig.code,
    message: customMessage || errorConfig.message,
    cause,
  });
}

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(`[${context}] Error:`, error);
    
    // If it's already a TRPCError, rethrow it
    if (error instanceof TRPCError) {
      throw error;
    }
    
    // Handle known error types
    if (error instanceof Error) {
      // Database errors
      if (error.message.includes('database') || error.message.includes('query')) {
        throw createError('DATABASE_ERROR', undefined, error);
      }
      
      // Network/fetch errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw createError('EXTERNAL_SERVICE_ERROR', undefined, error);
      }
    }
    
    // Default to internal error
    throw createError('INTERNAL_ERROR', undefined, error);
  }
}

/**
 * Validate required fields
 */
export function validateRequired<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[]
): void {
  const missing = fields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw createError(
      'INVALID_INPUT',
      `Missing required fields: ${missing.join(', ')}`
    );
  }
}

/**
 * Log request for debugging
 */
export function logRequest(
  procedure: string,
  input: any,
  userId?: number
): void {
  const timestamp = new Date().toISOString();
  const user = userId ? `user:${userId}` : 'anonymous';
  
  console.log(`[${timestamp}] [${procedure}] [${user}]`, {
    input: JSON.stringify(input).substring(0, 200), // Truncate long inputs
  });
}

/**
 * Log response for debugging
 */
export function logResponse(
  procedure: string,
  success: boolean,
  duration: number,
  error?: any
): void {
  const timestamp = new Date().toISOString();
  const status = success ? 'SUCCESS' : 'ERROR';
  
  console.log(`[${timestamp}] [${procedure}] [${status}] ${duration}ms`, {
    error: error ? error.message : undefined,
  });
}
