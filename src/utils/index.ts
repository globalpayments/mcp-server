/**
 * Utility functions for the MCP Server.
 */

import { createHash } from 'node:crypto';
import { parse as parseYaml } from 'yaml';
import { getSettings } from '../config/settings.js';
import {
  MIN_CARD_LENGTH,
  MAX_CARD_LENGTH,
  MASK_CHARACTER,
  DEFAULT_IDENTIFIER_PREFIX,
  DEFAULT_MIN_IDENTIFIER_LENGTH,
  DEFAULT_MAX_IDENTIFIER_LENGTH,
  NONCE_PREFIX,
  ERROR_MSG_CARD_DETECTED,
  ERROR_MSG_CARD_TRANSMISSION_FORBIDDEN,
  CONTEXT_TOOL_ARGUMENTS,
  ERROR_MSG_SECURITY_VIOLATION_REQUEST,
  SENSITIVE_KEYS,
} from './constants.js';
import { ValidationError } from './errors.js';

/**
 * Custom exception for card number detection.
 * Raised when a card number is detected in request or response data.
 */
export class CardNumberDetectedError extends Error {
  constructor(message: string = ERROR_MSG_CARD_DETECTED) {
    super(message);
    this.name = 'CardNumberDetectedError';
  }
}

/**
 * Card number regex patterns for detecting common card formats.
 */
const CARD_NUMBER_PATTERNS = [
  /(?<!\d)[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}(?!\d)/,  // 16-digit cards (Visa, MC, Discover)
  /(?<!\d)[0-9]{4}[\s-]?[0-9]{6}[\s-]?[0-9]{5}(?!\d)/,  // 15-digit cards (Amex)
  /(?<!\d)[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{4}[\s-]?[0-9]{2}(?!\d)/,  // 14-digit cards (Diners)
];

/**
 * Validate a card number using the Luhn algorithm (mod 10 check).
 * 
 * @param cardNumber - String of digits representing a card number.
 * @returns True if the card number passes Luhn validation, False otherwise.
 */
export function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '').split('').map(d => parseInt(d, 10));
  
  if (digits.length < MIN_CARD_LENGTH || digits.length > MAX_CARD_LENGTH) {
    return false;
  }
  
  let checksum = 0;
  let isSecondDigit = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    
    if (isSecondDigit) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    checksum += digit;
    isSecondDigit = !isSecondDigit;
  }
  
  return checksum % 10 === 0;
}

/**
 * Detect if a card number is present in the given text.
 * 
 * @param text - Text content to scan for card numbers.
 * @returns True if a valid card number is detected, False otherwise.
 */
export function detectCardNumber(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  for (const pattern of CARD_NUMBER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const digitsOnly = match.replace(/[\s-]/g, '');
        if (luhnCheck(digitsOnly)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Recursively validate that no card numbers are present in the data.
 * 
 * @param data - Data structure to validate (can be dict, array, string, or other types).
 * @param context - Description of where the data came from (for error messages).
 * @throws {CardNumberDetectedError} If a card number is detected in the data.
 */
export function validateNoCardNumbers(data: any, context: string = "data"): void {
  if (typeof data === 'string') {
    if (detectCardNumber(data)) {
      throw new CardNumberDetectedError(ERROR_MSG_CARD_TRANSMISSION_FORBIDDEN);
    }
  } else if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      for (const item of data) {
        validateNoCardNumbers(item, context);
      }
    } else {
      for (const value of Object.values(data)) {
        validateNoCardNumbers(value, context);
      }
    }
  }
}

/**
 * Validate tool arguments to ensure no card numbers are present.
 * 
 * @param arguments_ - Tool arguments to validate.
 * @throws {ValidationError} If card numbers are detected.
 */
export function validateToolArgumentsNoCardNumbers(arguments_: Record<string, any>): void {
  try {
    validateNoCardNumbers(arguments_, CONTEXT_TOOL_ARGUMENTS);
  } catch (error) {
    if (error instanceof CardNumberDetectedError) {
      throw new ValidationError(
        ERROR_MSG_SECURITY_VIOLATION_REQUEST,
        undefined,
        {
          security_violation: true,
          message: ERROR_MSG_SECURITY_VIOLATION_REQUEST,
        }
      );
    }
    throw error;
  }
}

export function parseYamlSpec(yamlContent: string): Record<string, any> {
  return parseYaml(yamlContent);
}

export function generateIdentifier(prefix: string = DEFAULT_IDENTIFIER_PREFIX, minLen: number = DEFAULT_MIN_IDENTIFIER_LENGTH, maxLen: number = DEFAULT_MAX_IDENTIFIER_LENGTH): string {
  const length = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomPart = '';
  for (let i = 0; i < length; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${randomPart}`;
}

export function generateNonce(): string {
  const timestamp = new Date().toISOString();
  return `${NONCE_PREFIX}${timestamp}`;
}

export function generateSecretHash(nonce: string, appSecret: string): string {
  const combined = nonce + appSecret;
  return createHash('sha512').update(combined).digest('hex');
}

export function maskSensitiveValue(value: string, maskChar: string = MASK_CHARACTER): string {
  if (!value) {
    return '';
  }
  return maskChar.repeat(value.length);
}

export function maskDictValues(
  data: Record<string, any>, 
  sensitiveKeys: string[]
): Record<string, any> {
  const maskedData: Record<string, any> = {};
  const sensitiveKeysLower = sensitiveKeys.map(key => key.toLowerCase());
  
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeysLower.includes(key.toLowerCase())) {
      if (typeof value === 'string') {
        maskedData[key] = maskSensitiveValue(value);
      } else {
        maskedData[key] = '***MASKED***';
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      maskedData[key] = maskDictValues(value, sensitiveKeys);
    } else if (Array.isArray(value)) {
      maskedData[key] = value.map(item => 
        typeof item === 'object' && item !== null ? maskDictValues(item, sensitiveKeys) : item
      );
    } else {
      maskedData[key] = value;
    }
  }
  
  return maskedData;
}

export function logApiCall(
  method: string,
  url: string,
  headers: Record<string, any>,
  requestBody?: any,
  responseStatus?: number,
  responseBody?: any
): void {
  const settings = getSettings();
  if (!settings.debug_api_calls) {
    return;
  }
  
  console.error('='.repeat(80));
  console.error(`API Call: ${method} ${url}`);
  console.error('-'.repeat(80));
  
  const maskedHeaders: Record<string, any> = {};
  for (const [k, v] of Object.entries(headers)) {
    maskedHeaders[k] = SENSITIVE_KEYS.includes(k.toLowerCase()) ? maskSensitiveValue(String(v)) : v;
  }
  console.error('Request Headers:', JSON.stringify(maskedHeaders, null, 2));
  
  if (requestBody) {
    if (typeof requestBody === 'object') {
      const maskedBody = maskDictValues(requestBody, SENSITIVE_KEYS);
      console.error('Request Body:', JSON.stringify(maskedBody, null, 2));
    } else {
      console.error('Request Body:', requestBody);
    }
  }
  
  if (responseStatus !== undefined) {
    console.error('-'.repeat(80));
    console.error(`Response Status: ${responseStatus}`);
    
    if (responseBody) {
      if (typeof responseBody === 'object') {
        const maskedResponse = maskDictValues(responseBody, SENSITIVE_KEYS);
        console.error('Response Body:', JSON.stringify(maskedResponse, null, 2));
      } else {
        console.error('Response Body:', responseBody);
      }
    }
  }

  console.error('='.repeat(80));
}