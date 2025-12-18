/**
 * Tests for data models
 */

import { describe, it, expect } from '@jest/globals';
import {
  TokenCacheSchema,
  AccessTokenResponseSchema,
  PaymentLinkRequestSchema,
} from '../src/models/index.js';

describe('TokenCacheSchema', () => {
  it('should validate valid token cache', () => {
    const validCache = {
      token: 'abc123',
      expiresAt: new Date(),
      createdAt: new Date(),
    };
    
    const result = TokenCacheSchema.safeParse(validCache);
    expect(result.success).toBe(true);
  });

  it('should validate token cache with account name', () => {
    const validCache = {
      token: 'abc123',
      expiresAt: new Date(),
      createdAt: new Date(),
      accountName: 'test_account',
    };
    
    const result = TokenCacheSchema.safeParse(validCache);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accountName).toBe('test_account');
    }
  });

  it('should reject missing required fields', () => {
    const invalid = {
      token: 'abc123',
    };
    
    const result = TokenCacheSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject invalid date types', () => {
    const invalid = {
      token: 'abc123',
      expiresAt: 'not-a-date',
      createdAt: new Date(),
    };
    
    const result = TokenCacheSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('AccessTokenResponseSchema', () => {
  it('should validate minimal token response', () => {
    const validResponse = {
      token: 'access_token_123',
      type: 'Bearer',
    };
    
    const result = AccessTokenResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it('should use default Bearer type', () => {
    const response = {
      token: 'access_token_123',
    };
    
    const result = AccessTokenResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe('Bearer');
    }
  });

  it('should validate full token response', () => {
    const validResponse = {
      token: 'access_token_123',
      type: 'Bearer',
      seconds_to_expire: 599,
      scope: 'LNK_POST_Create',
      app_id: 'app_123',
      app_name: 'Test App',
      time_created: '2023-01-01T00:00:00Z',
      interval_to_expire: '10_minutes',
      email: 'test@example.com',
    };
    
    const result = AccessTokenResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it('should handle scope as string', () => {
    const response = {
      token: 'token',
      scope: 'LNK_POST_Create',
    };
    
    const result = AccessTokenResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should handle scope as array', () => {
    const response = {
      token: 'token',
      scope: ['LNK_POST_Create', 'LNK_GET_List'],
    };
    
    const result = AccessTokenResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should handle scope as object', () => {
    const response = {
      token: 'token',
      scope: { accounts: { name: 'test' } },
    };
    
    const result = AccessTokenResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should handle null scope', () => {
    const response = {
      token: 'token',
      scope: null,
    };
    
    const result = AccessTokenResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should reject missing token', () => {
    const invalid = {
      type: 'Bearer',
    };
    
    const result = AccessTokenResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('PaymentLinkRequestSchema', () => {
  it('should validate complete payment link request', () => {
    const validRequest = {
      type: 'PAYMENT',
      merchant_id: 'merch_123',
      account_id: 'acc_123',
      usage_mode: 'SINGLE',
      name: 'Test Link',
      description: 'Test Description',
      reference: 'ref_123',
      shippable: 'NO',
      transactions: {
        amount: '1000',
        currency: 'USD',
      },
    };
    
    const result = PaymentLinkRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('should validate with optional fields', () => {
    const validRequest = {
      type: 'PAYMENT',
      merchant_id: 'merch_123',
      account_id: 'acc_123',
      usage_mode: 'MULTIPLE',
      name: 'Test Link',
      description: 'Test Description',
      reference: 'ref_123',
      shippable: 'YES',
      usage_limit: 10,
      expiration_date: '2024-12-31',
      transactions: {
        amount: '1000',
      },
      notifications: {
        email: 'test@example.com',
      },
    };
    
    const result = PaymentLinkRequestSchema.safeParse(validRequest);
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const invalid = {
      type: 'PAYMENT',
      name: 'Test',
    };
    
    const result = PaymentLinkRequestSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
