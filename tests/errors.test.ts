/**
 * Tests for error classes
 */

import { describe, it, expect } from '@jest/globals';
import {
  MCPError,
  ValidationError,
  AuthenticationError,
  APIError,
  NetworkError,
  ErrorCode,
  createErrorResponse,
  createSuccessResponse,
} from '../src/utils/errors.js';

describe('MCPError', () => {
  it('should create error with code and message', () => {
    const error = new MCPError(
      ErrorCode.API_ERROR,
      'Test error message'
    );
    
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(ErrorCode.API_ERROR);
    expect(error.message).toBe('Test error message');
    expect(error.name).toBe('MCPError');
  });

  it('should include details in error object', () => {
    const error = new MCPError(
      ErrorCode.API_ERROR,
      'Test error',
      { statusCode: 500 }
    );
    
    expect(error.details).toEqual({ statusCode: 500 });
  });

  it('should convert to dictionary format', () => {
    const error = new MCPError(
      ErrorCode.VALIDATION_ERROR,
      'Invalid input',
      { field: 'amount' }
    );
    
    const dict = error.toDict();
    expect(dict).toEqual({
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid input',
        details: { field: 'amount' },
      },
    });
  });

  it('should convert to text content format', () => {
    const error = new MCPError(
      ErrorCode.API_ERROR,
      'API failed'
    );
    
    const textContent = error.toTextContent();
    expect(textContent.type).toBe('text');
    expect(textContent.text).toContain('API_ERROR');
    expect(textContent.text).toContain('API failed');
  });

  it('should handle empty details', () => {
    const error = new MCPError(
      ErrorCode.API_ERROR,
      'Test error'
    );
    
    const dict = error.toDict();
    expect(dict.error.details).toBeUndefined();
  });

  it('should preserve original error', () => {
    const originalError = new Error('Original');
    const error = new MCPError(
      ErrorCode.API_ERROR,
      'Wrapped error',
      {},
      originalError
    );
    
    expect(error.originalError).toBe(originalError);
  });
});

describe('ValidationError', () => {
  it('should create validation error with field', () => {
    const error = new ValidationError(
      'Invalid currency code',
      'currency',
      { provided_value: 'XX' }
    );
    
    expect(error).toBeInstanceOf(MCPError);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.details.field).toBe('currency');
    expect(error.details.provided_value).toBe('XX');
  });

  it('should work without field parameter', () => {
    const error = new ValidationError('General validation error');
    
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('General validation error');
  });
});

describe('AuthenticationError', () => {
  it('should create authentication error with default code', () => {
    const error = new AuthenticationError('Auth failed');
    
    expect(error).toBeInstanceOf(MCPError);
    expect(error.code).toBe(ErrorCode.AUTH_FAILED);
    expect(error.message).toBe('Auth failed');
  });

  it('should create authentication error with custom code', () => {
    const error = new AuthenticationError(
      'Token expired',
      ErrorCode.TOKEN_EXPIRED
    );
    
    expect(error.code).toBe(ErrorCode.TOKEN_EXPIRED);
  });

  it('should preserve original error', () => {
    const originalError = new Error('Network timeout');
    const error = new AuthenticationError(
      'Auth failed due to network',
      ErrorCode.AUTH_FAILED,
      {},
      originalError
    );
    
    expect(error.originalError).toBe(originalError);
  });
});

describe('APIError', () => {
  it('should create API error with status code', () => {
    const error = new APIError(
      'API request failed',
      500
    );
    
    expect(error).toBeInstanceOf(MCPError);
    expect(error.code).toBe(ErrorCode.API_ERROR);
    expect(error.details.status_code).toBe(500);
  });

  it('should include response body', () => {
    const error = new APIError(
      'Not found',
      404,
      'Resource not found'
    );
    
    expect(error.details.response_body).toBe('Resource not found');
  });

  it('should include additional details', () => {
    const error = new APIError(
      'Error',
      500,
      undefined,
      { custom: 'data' }
    );
    
    expect(error.details.custom).toBe('data');
  });
});

describe('NetworkError', () => {
  it('should create network error', () => {
    const error = new NetworkError(
      'Connection timeout',
      ErrorCode.TIMEOUT_ERROR
    );
    
    expect(error).toBeInstanceOf(MCPError);
    expect(error.code).toBe(ErrorCode.TIMEOUT_ERROR);
  });
});

describe('Helper Functions', () => {
  describe('createErrorResponse', () => {
    it('should create error response without details', () => {
      const response = createErrorResponse(
        ErrorCode.API_ERROR,
        'Test error'
      );
      
      expect(response.type).toBe('text');
      const parsed = JSON.parse(response.text);
      expect(parsed.error.code).toBe(ErrorCode.API_ERROR);
      expect(parsed.error.message).toBe('Test error');
    });

    it('should create error response with details', () => {
      const response = createErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Invalid field',
        { field: 'amount' }
      );
      
      const parsed = JSON.parse(response.text);
      expect(parsed.error.details).toEqual({ field: 'amount' });
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response', () => {
      const response = createSuccessResponse({
        status: 'success',
        data: { id: '123' },
      });
      
      expect(response.type).toBe('text');
      const parsed = JSON.parse(response.text);
      expect(parsed.status).toBe('success');
      expect(parsed.data.id).toBe('123');
    });
  });
});
