/**
 * Tests for validation utility functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateCurrencyCode,
  validateCountryCode,
  validateDateFormat,
  validateAmount,
  validateEnumValue,
  validatePageNumber,
  validatePageSize,
} from '../src/utils/validators.js';
import { ValidationError } from '../src/utils/errors.js';

describe('validateCurrencyCode', () => {
  it('should accept valid 3-letter currency codes', () => {
    expect(() => validateCurrencyCode('USD')).not.toThrow();
    expect(() => validateCurrencyCode('EUR')).not.toThrow();
    expect(() => validateCurrencyCode('GBP')).not.toThrow();
  });

  it('should reject invalid currency codes', () => {
    expect(() => validateCurrencyCode('US')).toThrow(ValidationError);
    expect(() => validateCurrencyCode('USDT')).toThrow(ValidationError);
    expect(() => validateCurrencyCode('usd')).toThrow(ValidationError);
    expect(() => validateCurrencyCode('123')).toThrow(ValidationError);
  });

  it('should include field name in error message', () => {
    try {
      validateCurrencyCode('XX', 'testCurrency');
      fail('Should have thrown ValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).details.field).toBe('testCurrency');
    }
  });
});

describe('validateCountryCode', () => {
  it('should accept valid 2-letter country codes', () => {
    expect(() => validateCountryCode('US')).not.toThrow();
    expect(() => validateCountryCode('GB')).not.toThrow();
    expect(() => validateCountryCode('CA')).not.toThrow();
  });

  it('should reject invalid country codes', () => {
    expect(() => validateCountryCode('USA')).toThrow(ValidationError);
    expect(() => validateCountryCode('U')).toThrow(ValidationError);
    expect(() => validateCountryCode('us')).toThrow(ValidationError);
    expect(() => validateCountryCode('12')).toThrow(ValidationError);
  });
});

describe('validateDateFormat', () => {
  it('should accept valid YYYY-MM-DD dates', () => {
    expect(() => validateDateFormat('2023-01-15', 'testDate')).not.toThrow();
    expect(() => validateDateFormat('2024-12-31', 'testDate')).not.toThrow();
    expect(() => validateDateFormat('2025-06-01', 'testDate')).not.toThrow();
  });

  it('should reject invalid date formats', () => {
    expect(() => validateDateFormat('01-15-2023', 'testDate')).toThrow(ValidationError);
    expect(() => validateDateFormat('2023/01/15', 'testDate')).toThrow(ValidationError);
    expect(() => validateDateFormat('2023-1-15', 'testDate')).toThrow(ValidationError);
    expect(() => validateDateFormat('not-a-date', 'testDate')).toThrow(ValidationError);
  });
});

describe('validateAmount', () => {
  it('should accept valid amounts as numbers', () => {
    expect(validateAmount(100)).toBe(100);
    expect(validateAmount(1)).toBe(1);
    expect(validateAmount(99999)).toBe(99999);
  });

  it('should accept valid amounts as strings', () => {
    expect(validateAmount('100')).toBe(100);
    expect(validateAmount('1')).toBe(1);
    expect(validateAmount('99999')).toBe(99999);
  });

  it('should reject amounts below minimum', () => {
    expect(() => validateAmount(0)).toThrow(ValidationError);
    expect(() => validateAmount(-1)).toThrow(ValidationError);
    expect(() => validateAmount('0')).toThrow(ValidationError);
  });

  it('should respect custom minimum value', () => {
    expect(validateAmount(5, 'amount', 5)).toBe(5);
    expect(() => validateAmount(4, 'amount', 5)).toThrow(ValidationError);
  });

  it('should reject non-numeric strings', () => {
    expect(() => validateAmount('abc')).toThrow(ValidationError);
  });
});

describe('validateEnumValue', () => {
  it('should accept valid enum values', () => {
    const allowedValues = ['SINGLE', 'MULTIPLE'];
    expect(() => validateEnumValue('SINGLE', allowedValues, 'mode')).not.toThrow();
    expect(() => validateEnumValue('MULTIPLE', allowedValues, 'mode')).not.toThrow();
  });

  it('should reject invalid enum values', () => {
    const allowedValues = ['SINGLE', 'MULTIPLE'];
    expect(() => validateEnumValue('INVALID', allowedValues, 'mode')).toThrow(ValidationError);
  });

  it('should be case-sensitive', () => {
    const allowedValues = ['SINGLE', 'MULTIPLE'];
    expect(() => validateEnumValue('single', allowedValues, 'mode')).toThrow(ValidationError);
  });
});

describe('validatePageNumber', () => {
  it('should accept valid page numbers', () => {
    expect(validatePageNumber(1)).toBe(1);
    expect(validatePageNumber(10)).toBe(10);
    expect(validatePageNumber('5')).toBe(5);
  });

  it('should reject invalid page numbers', () => {
    expect(() => validatePageNumber(0)).toThrow(ValidationError);
    expect(() => validatePageNumber(-1)).toThrow(ValidationError);
  });
});

describe('validatePageSize', () => {
  it('should accept valid page sizes', () => {
    expect(validatePageSize(10)).toBe(10);
    expect(validatePageSize(500)).toBe(500);
    expect(validatePageSize('100')).toBe(100);
  });

  it('should reject page sizes below minimum', () => {
    expect(() => validatePageSize(0)).toThrow(ValidationError);
  });

  it('should reject page sizes above maximum', () => {
    expect(() => validatePageSize(1001)).toThrow(ValidationError);
  });
});
