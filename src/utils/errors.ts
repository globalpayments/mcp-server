/**
 * Standardized error handling for the MCP Server
 */

import { TextContent } from '@modelcontextprotocol/sdk/types.js';

export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FIELD_VALUE = "INVALID_FIELD_VALUE",
  INVALID_FIELD_TYPE = "INVALID_FIELD_TYPE",

  AUTH_FAILED = "AUTH_FAILED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  CREDENTIALS_INVALID = "CREDENTIALS_INVALID",

  API_ERROR = "API_ERROR",
  API_TIMEOUT = "API_TIMEOUT",
  API_UNAVAILABLE = "API_UNAVAILABLE",
  API_RATE_LIMIT = "API_RATE_LIMIT",

  NETWORK_ERROR = "NETWORK_ERROR",
  CONNECTION_ERROR = "CONNECTION_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",

  INTERNAL_ERROR = "INTERNAL_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",

  DOC_NOT_FOUND = "DOC_NOT_FOUND",
  DOC_FETCH_FAILED = "DOC_FETCH_FAILED",
  DOC_PARSE_ERROR = "DOC_PARSE_ERROR",
  DOC_NETWORK_ERROR = "DOC_NETWORK_ERROR",
}

export class MCPError extends Error {
  public code: ErrorCode;
  public details: Record<string, any>;
  public originalError?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    details: Record<string, any> = {},
    originalError?: Error
  ) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.details = details;
    this.originalError = originalError;
  }

  toDict(): Record<string, any> {
    const errorDict: Record<string, any> = {
      code: this.code,
      message: this.message,
    };
    if (Object.keys(this.details).length > 0) {
      errorDict.details = this.details;
    }
    return { error: errorDict };
  }

  toTextContent(): TextContent {
    return {
      type: 'text',
      text: JSON.stringify(this.toDict(), null, 2),
    };
  }
}

export class ValidationError extends MCPError {
  constructor(
    message: string,
    field?: string,
    details: Record<string, any> = {}
  ) {
    const errorDetails = { ...details };
    if (field) {
      errorDetails.field = field;
    }
    super(ErrorCode.VALIDATION_ERROR, message, errorDetails);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends MCPError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.AUTH_FAILED,
    details: Record<string, any> = {},
    originalError?: Error
  ) {
    super(code, message, details, originalError);
    this.name = 'AuthenticationError';
  }
}

export class APIError extends MCPError {
  constructor(
    message: string,
    statusCode?: number,
    responseBody?: string,
    details: Record<string, any> = {},
    originalError?: Error
  ) {
    const errorDetails = { ...details };
    if (statusCode !== undefined) {
      errorDetails.status_code = statusCode;
    }
    if (responseBody) {
      errorDetails.response_body = responseBody;
    }
    super(ErrorCode.API_ERROR, message, errorDetails, originalError);
    this.name = 'APIError';
  }
}

export class NetworkError extends MCPError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.NETWORK_ERROR,
    details: Record<string, any> = {},
    originalError?: Error
  ) {
    super(code, message, details, originalError);
    this.name = 'NetworkError';
  }
}

export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: Record<string, any>
): TextContent {
  const errorObj = { error: { code, message } };
  if (details) {
    (errorObj.error as any).details = details;
  }
  return {
    type: 'text',
    text: JSON.stringify(errorObj, null, 2),
  };
}

export function createSuccessResponse(data: Record<string, any>): TextContent {
  return {
    type: 'text',
    text: JSON.stringify(data, null, 2),
  };
}

export function logError(
  error: Error,
  context: string = '',
  includeTraceback: boolean = true
): void {
  if (error instanceof MCPError) {
    console.error(
      `${context}: [${error.code}] ${error.message} - Details:`,
      error.details,
      includeTraceback && error.originalError ? error.originalError : ''
    );
  } else {
    console.error(`${context}: ${error.message}`, includeTraceback ? error.stack : '');
  }
}