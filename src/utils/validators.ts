/**
 * Validation functions for the MCP Server.
 */

import {
  MIN_AMOUNT,
  MIN_PAGE_NUMBER,
  MIN_PAGE_SIZE,
  MAX_PAGE_SIZE,
  REGEX_COUNTRY_CODE,
  REGEX_CURRENCY_CODE,
  REGEX_DATE_YYYY_MM_DD,
} from './constants.js';
import { ValidationError } from './errors.js';

/**
 * Validate a currency code matches ISO 4217 format (3-letter code).
 * 
 * @param currency - Currency code to validate (e.g., "USD", "EUR").
 * @param fieldName - Name of the field for error messages.
 * @throws {ValidationError} If currency code is invalid.
 */
export function validateCurrencyCode(currency: string, fieldName: string = "currency"): void {
  if (!REGEX_CURRENCY_CODE.test(currency)) {
    throw new ValidationError(
      "currency must be a 3-letter ISO 4217 code (e.g., 'USD', 'EUR')",
      fieldName,
      { provided_value: currency }
    );
  }
}

/**
 * Validate a country code matches ISO 3166-1 format (2-letter code).
 * 
 * @param country - Country code to validate (e.g., "US", "GB").
 * @param fieldName - Name of the field for error messages.
 * @throws {ValidationError} If country code is invalid.
 */
export function validateCountryCode(country: string, fieldName: string = "country"): void {
  if (!REGEX_COUNTRY_CODE.test(country)) {
    throw new ValidationError(
      "country must be a 2-letter ISO 3166-1 code (e.g., 'US', 'GB')",
      fieldName,
      { provided_value: country }
    );
  }
}

/**
 * Validate a date string matches YYYY-MM-DD format.
 * 
 * @param dateStr - Date string to validate.
 * @param fieldName - Name of the field for error messages.
 * @throws {ValidationError} If date format is invalid.
 */
export function validateDateFormat(dateStr: string, fieldName: string): void {
  if (!REGEX_DATE_YYYY_MM_DD.test(dateStr)) {
    throw new ValidationError(
      `${fieldName} must be in YYYY-MM-DD format`,
      fieldName,
      { provided_value: dateStr }
    );
  }
}

/**
 * Validate and parse an amount value.
 * 
 * @param amount - Amount to validate (as string or number).
 * @param fieldName - Name of the field for error messages.
 * @param minValue - Minimum allowed value.
 * @returns Parsed amount as integer.
 * @throws {ValidationError} If amount is invalid or below minimum.
 */
export function validateAmount(amount: string | number, fieldName: string = "amount", minValue: number = MIN_AMOUNT): number {
  try {
    const amountValue = typeof amount === 'string' ? parseInt(amount, 10) : amount;
    if (isNaN(amountValue) || amountValue < minValue) {
      throw new ValidationError(
        `${fieldName} must be greater than or equal to ${minValue}`,
        fieldName,
        { provided_value: amount }
      );
    }
    return amountValue;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      `${fieldName} must be a valid integer`,
      fieldName,
      { provided_value: amount }
    );
  }
}

/**
 * Validate an enum value is within allowed values.
 * 
 * @param value - Value to validate.
 * @param validValues - List of valid values.
 * @param fieldName - Name of the field for error messages.
 * @throws {ValidationError} If value is not in valid values list.
 */
export function validateEnumValue(value: string, validValues: string[], fieldName: string): void {
  if (!validValues.includes(value)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${validValues.join(', ')}`,
      fieldName,
      { provided_value: value, valid_values: validValues }
    );
  }
}

/**
 * Validate page number for pagination.
 * 
 * @param page - Page number to validate.
 * @param fieldName - Name of the field for error messages.
 * @returns Parsed page number as integer.
 * @throws {ValidationError} If page number is invalid.
 */
export function validatePageNumber(page: any, fieldName: string = "page"): number {
  try {
    const pageValue = typeof page === 'string' ? parseInt(page, 10) : page;
    if (isNaN(pageValue) || pageValue < MIN_PAGE_NUMBER) {
      throw new ValidationError(
        `${fieldName} must be greater than or equal to ${MIN_PAGE_NUMBER}`,
        fieldName,
        { provided_value: page }
      );
    }
    return pageValue;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      `${fieldName} must be a valid integer`,
      fieldName,
      { provided_value: page }
    );
  }
}

/**
 * Validate page size for pagination.
 * 
 * @param pageSize - Page size to validate.
 * @param fieldName - Name of the field for error messages.
 * @returns Parsed page size as integer.
 * @throws {ValidationError} If page size is invalid or out of range.
 */
export function validatePageSize(pageSize: any, fieldName: string = "page_size"): number {
  try {
    const pageSizeValue = typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;
    if (isNaN(pageSizeValue) || pageSizeValue < MIN_PAGE_SIZE || pageSizeValue > MAX_PAGE_SIZE) {
      throw new ValidationError(
        `${fieldName} must be between ${MIN_PAGE_SIZE} and ${MAX_PAGE_SIZE}`,
        fieldName,
        { provided_value: pageSize }
      );
    }
    return pageSizeValue;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      `${fieldName} must be a valid integer`,
      fieldName,
      { provided_value: pageSize }
    );
  }
}
