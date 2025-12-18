/**
 * Tests for utility functions in index.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  luhnCheck,
  detectCardNumber,
  generateIdentifier,
  validateToolArgumentsNoCardNumbers,
  maskSensitiveValue,
  maskDictValues,
} from '../src/utils/index.js';
import { ValidationError } from '../src/utils/errors.js';

describe('luhnCheck', () => {
  it('should validate correct card numbers', () => {
    expect(luhnCheck('4532015112830366')).toBe(true); // Valid Visa
    expect(luhnCheck('6011111111111117')).toBe(true); // Valid Discover
  });

  it('should reject invalid card numbers', () => {
    expect(luhnCheck('1234567890123456')).toBe(false);
    expect(luhnCheck('4532015112830367')).toBe(false); // Invalid checksum
  });

  it('should reject numbers outside valid length range', () => {
    expect(luhnCheck('123456789012')).toBe(false); // Too short
    expect(luhnCheck('12345678901234567890')).toBe(false); // Too long
  });

  it('should handle numbers with no digits', () => {
    expect(luhnCheck('abcd')).toBe(false);
  });
});

describe('detectCardNumber', () => {
  it('should detect valid card numbers in text', () => {
    expect(detectCardNumber('Card: 4532015112830366')).toBe(true);
    expect(detectCardNumber('Pay with 6011111111111117')).toBe(true);
  });

  it('should detect card numbers with spaces', () => {
    expect(detectCardNumber('Card: 4532 0151 1283 0366')).toBe(true);
  });

  it('should detect card numbers with dashes', () => {
    expect(detectCardNumber('Card: 4532-0151-1283-0366')).toBe(true);
  });

  it('should not detect invalid card numbers', () => {
    expect(detectCardNumber('ID: 1234567890123456')).toBe(false);
  });

  it('should return false for non-string input', () => {
    expect(detectCardNumber(null as any)).toBe(false);
    expect(detectCardNumber(undefined as any)).toBe(false);
    expect(detectCardNumber(123 as any)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(detectCardNumber('')).toBe(false);
  });
});

describe('maskSensitiveValue', () => {
  it('should mask sensitive values', () => {
    expect(maskSensitiveValue('secret123')).toBe('*********');
    expect(maskSensitiveValue('secret123').length).toBe(9);
  });

  it('should use custom mask character', () => {
    expect(maskSensitiveValue('secret', 'X')).toBe('XXXXXX');
    expect(maskSensitiveValue('secret', 'X').length).toBe(6);
  });

  it('should handle empty string', () => {
    expect(maskSensitiveValue('')).toBe('');
  });
});

describe('maskDictValues', () => {
  it('should mask sensitive keys in dictionary', () => {
    const data = {
      authorization: 'Bearer token123',
      username: 'john',
    };
    const masked = maskDictValues(data, ['authorization']);
    expect(masked.authorization).toBe('***************');
    expect(masked.username).toBe('john');
  });

  it('should handle nested objects', () => {
    const data = {
      headers: {
        authorization: 'Bearer token',
        'content-type': 'application/json',
      },
    };
    const masked = maskDictValues(data, ['authorization']);
    expect(masked.headers.authorization).toBe('************');
    expect(masked.headers['content-type']).toBe('application/json');
  });

  it('should handle arrays', () => {
    const data = {
      items: [
        { id: 1, secret: 'secret1' },
        { id: 2, token: 'token2' },
      ],
    };
    const masked = maskDictValues(data, ['secret', 'token']);
    expect(masked.items[0].secret).toBe('*******');
    expect(masked.items[1].token).toBe('******');
    expect(masked.items[0].id).toBe(1);
  });

  it('should handle empty objects and arrays', () => {
    expect(maskDictValues({}, [])).toEqual({});
    const data = { items: [] };
    expect(maskDictValues(data, [])).toEqual(data);
  });
});

describe('generateIdentifier', () => {
  it('should generate identifier with prefix', () => {
    const id = generateIdentifier('test', 5, 10);
    expect(id).toMatch(/^test_[A-Za-z0-9]+$/);
  });

  it('should respect minimum length', () => {
    const id = generateIdentifier('id', 12, 20);
    expect(id.length).toBeGreaterThanOrEqual(12);
  });

  it('should respect maximum length', () => {
    const id = generateIdentifier('id', 5, 10);
    // Note: generated ID includes prefix + _ + random part, so total can exceed maxLen
    expect(id).toMatch(/^id_[A-Za-z0-9]+$/);
    // The random part should be between 5-10 chars
    const randomPart = id.split('_')[1];
    expect(randomPart.length).toBeGreaterThanOrEqual(5);
    expect(randomPart.length).toBeLessThanOrEqual(10);
  });

  it('should generate different identifiers', () => {
    const id1 = generateIdentifier('test', 8, 12);
    const id2 = generateIdentifier('test', 8, 12);
    expect(id1).not.toBe(id2);
  });
});

describe('validateToolArgumentsNoCardNumbers', () => {
  it('should pass validation for safe arguments', () => {
    const args = {
      amount: '1000',
      currency: 'USD',
      country: 'US',
    };
    expect(() => validateToolArgumentsNoCardNumbers(args)).not.toThrow();
  });

  it('should throw error if card number detected', () => {
    const args = {
      amount: '1000',
      note: 'Card number is 4532015112830366',
    };
    expect(() => validateToolArgumentsNoCardNumbers(args)).toThrow(ValidationError);
  });

  it('should throw error for card number in nested object', () => {
    const args = {
      data: {
        payment: '4532015112830366',
      },
    };
    expect(() => validateToolArgumentsNoCardNumbers(args)).toThrow(ValidationError);
  });

  it('should handle arrays', () => {
    const args = {
      items: ['item1', 'Card: 4532015112830366'],
    };
    expect(() => validateToolArgumentsNoCardNumbers(args)).toThrow(ValidationError);
  });

  it('should handle empty objects', () => {
    expect(() => validateToolArgumentsNoCardNumbers({})).not.toThrow();
  });
});
