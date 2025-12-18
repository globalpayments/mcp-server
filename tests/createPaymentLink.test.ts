/**
 * Tests for createPaymentLink tool - focusing on validation and processing logic
 */

import { describe, it, expect } from '@jest/globals';
import { TOOL_DEFINITION } from '../src/tools/createPaymentLink.js';

describe('createPaymentLink tool definition', () => {
  it('should have correct tool name', () => {
    expect(TOOL_DEFINITION.name).toBe('create_payment_link');
  });

  it('should have description', () => {
    expect(TOOL_DEFINITION.description).toContain('payment link');
    expect(TOOL_DEFINITION.description).toContain('Global Payments API');
  });

  it('should have required fields', () => {
    expect(TOOL_DEFINITION.inputSchema.required).toEqual([
      'amount',
      'currency',
      'country',
    ]);
  });

  it('should define amount field', () => {
    const amountField = TOOL_DEFINITION.inputSchema.properties?.amount as any;
    expect(amountField.type).toBe('string');
    expect(amountField.description).toContain('smallest currency unit');
  });

  it('should define currency field with pattern', () => {
    const currencyField = TOOL_DEFINITION.inputSchema.properties?.currency as any;
    expect(currencyField.type).toBe('string');
    expect(currencyField.pattern).toBe('^[A-Z]{3}$');
  });

  it('should define country field with pattern', () => {
    const countryField = TOOL_DEFINITION.inputSchema.properties?.country as any;
    expect(countryField.type).toBe('string');
    expect(countryField.pattern).toBe('^[A-Z]{2}$');
  });

  it('should define usage_mode enum', () => {
    const usageModeField = TOOL_DEFINITION.inputSchema.properties?.usage_mode as any;
    expect(usageModeField.enum).toEqual(['SINGLE', 'MULTIPLE']);
  });

  it('should define shippable enum', () => {
    const shippableField = TOOL_DEFINITION.inputSchema.properties?.shippable as any;
    expect(shippableField.enum).toEqual(['YES', 'NO']);
  });

  it('should have all expected properties', () => {
    const properties = TOOL_DEFINITION.inputSchema.properties;
    expect(properties).toHaveProperty('amount');
    expect(properties).toHaveProperty('currency');
    expect(properties).toHaveProperty('country');
    expect(properties).toHaveProperty('name');
    expect(properties).toHaveProperty('description');
    expect(properties).toHaveProperty('reference');
    expect(properties).toHaveProperty('usage_mode');
    expect(properties).toHaveProperty('usage_limit');
    expect(properties).toHaveProperty('expiration_date');
    expect(properties).toHaveProperty('shippable');
    expect(properties).toHaveProperty('shipping_amount');
  });
});
