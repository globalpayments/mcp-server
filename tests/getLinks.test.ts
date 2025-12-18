/**
 * Tests for getLinks tool definition
 */

import { describe, it, expect } from '@jest/globals';
import { GET_LINKS_TOOL } from '../src/tools/getLinks.js';

describe('getLinks tool definition', () => {
  it('should have correct tool name', () => {
    expect(GET_LINKS_TOOL.name).toBe('get_links');
  });

  it('should have description', () => {
    expect(GET_LINKS_TOOL.description).toContain('payment link');
    expect(GET_LINKS_TOOL.description).toContain('Global Payments API');
  });

  it('should not have required fields (all optional)', () => {
    const required = GET_LINKS_TOOL.inputSchema.required as any;
    expect(!required || required.length === 0).toBe(true);
  });

  it('should define id field', () => {
    const idField = GET_LINKS_TOOL.inputSchema.properties?.id as any;
    expect(idField.type).toBe('string');
    expect(idField.description).toContain('Payment link ID');
  });

  it('should define date filter fields', () => {
    const fromField = GET_LINKS_TOOL.inputSchema.properties?.from_time_created as any;
    const toField = GET_LINKS_TOOL.inputSchema.properties?.to_time_created as any;
    expect(fromField.format).toBe('date');
    expect(toField.format).toBe('date');
  });

  it('should define status enum field', () => {
    const statusField = GET_LINKS_TOOL.inputSchema.properties?.status as any;
    expect(statusField.enum).toContain('ACTIVE');
    expect(statusField.enum).toContain('CLOSED');
    expect(statusField.enum).toContain('PAID');
  });

  it('should define usage_mode enum field', () => {
    const usageModeField = GET_LINKS_TOOL.inputSchema.properties?.usage_mode as any;
    expect(usageModeField.enum).toContain('SINGLE');
    expect(usageModeField.enum).toContain('MULTIPLE');
  });

  it('should have pagination properties', () => {
    const properties = GET_LINKS_TOOL.inputSchema.properties;
    expect(properties).toHaveProperty('page');
    expect(properties).toHaveProperty('page_size');
  });

  it('should have filter properties', () => {
    const properties = GET_LINKS_TOOL.inputSchema.properties;
    expect(properties).toHaveProperty('name');
    expect(properties).toHaveProperty('description');
    expect(properties).toHaveProperty('amount');
    expect(properties).toHaveProperty('currency');
    expect(properties).toHaveProperty('country');
  });
});
