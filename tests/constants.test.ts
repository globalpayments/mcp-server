/**
 * Tests for constants
 */

import { describe, it, expect } from '@jest/globals';
import {
  API_VERSION,
  BASE_URL_SANDBOX,
  BASE_URL_PROD,
  REGEX_CURRENCY_CODE,
  REGEX_COUNTRY_CODE,
  REGEX_DATE_YYYY_MM_DD,
  MIN_AMOUNT,
  MAX_PAGE_SIZE,
  DEFAULT_LINK_NAME,
  USAGE_MODES,
  SHIPPABLE_VALUES,
} from '../src/utils/constants.js';

describe('Constants', () => {
  it('should have valid API version', () => {
    expect(API_VERSION).toBe('2021-03-22');
    expect(typeof API_VERSION).toBe('string');
  });

  it('should have valid base URLs', () => {
    expect(BASE_URL_SANDBOX).toContain('https://');
    expect(BASE_URL_SANDBOX).toContain('globalpay.com');
    expect(BASE_URL_PROD).toContain('https://');
  });

  it('should have working regex patterns', () => {
    expect(REGEX_CURRENCY_CODE.test('USD')).toBe(true);
    expect(REGEX_CURRENCY_CODE.test('EUR')).toBe(true);
    expect(REGEX_CURRENCY_CODE.test('US')).toBe(false);
    
    expect(REGEX_COUNTRY_CODE.test('US')).toBe(true);
    expect(REGEX_COUNTRY_CODE.test('GB')).toBe(true);
    expect(REGEX_COUNTRY_CODE.test('USA')).toBe(false);
    
    expect(REGEX_DATE_YYYY_MM_DD.test('2023-01-15')).toBe(true);
    expect(REGEX_DATE_YYYY_MM_DD.test('01-15-2023')).toBe(false);
  });

  it('should have valid minimum amount', () => {
    expect(MIN_AMOUNT).toBe(1);
    expect(typeof MIN_AMOUNT).toBe('number');
  });

  it('should have valid maximum page size', () => {
    expect(MAX_PAGE_SIZE).toBe(1000);
    expect(typeof MAX_PAGE_SIZE).toBe('number');
  });

  it('should have valid default link name', () => {
    expect(DEFAULT_LINK_NAME).toBe('Global Payments Payment Link');
    expect(typeof DEFAULT_LINK_NAME).toBe('string');
  });

  it('should have valid usage modes', () => {
    expect(USAGE_MODES).toContain('SINGLE');
    expect(USAGE_MODES).toContain('MULTIPLE');
    expect(USAGE_MODES).toHaveLength(2);
  });

  it('should have valid shippable values', () => {
    expect(SHIPPABLE_VALUES).toContain('YES');
    expect(SHIPPABLE_VALUES).toContain('NO');
    expect(SHIPPABLE_VALUES).toHaveLength(2);
  });
});
