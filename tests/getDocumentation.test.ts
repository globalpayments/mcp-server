/**
 * Tests for getDocumentation tool definition  
 */

import { describe, it, expect } from '@jest/globals';
import { GET_DOCUMENTATION_TOOL, DOCUMENTATION_CATEGORIES } from '../src/tools/getDocumentation.js';

describe('getDocumentation tool definition', () => {
  it('should have correct tool name', () => {
    expect(GET_DOCUMENTATION_TOOL.name).toBe('get_documentation');
  });

  it('should have description', () => {
    expect(GET_DOCUMENTATION_TOOL.description).toContain('API documentation');
    expect(GET_DOCUMENTATION_TOOL.description).toContain('Global Payments');
  });

  it('should have category as required field', () => {
    expect(GET_DOCUMENTATION_TOOL.inputSchema.required).toContain('category');
  });

  it('should define category field with enum', () => {
    const categoryField = GET_DOCUMENTATION_TOOL.inputSchema.properties?.category as any;
    expect(categoryField.type).toBe('string');
    expect(categoryField.enum).toBeDefined();
    expect(categoryField.enum.length).toBeGreaterThan(0);
  });

  it('should define endpoint field', () => {
    const endpointField = GET_DOCUMENTATION_TOOL.inputSchema.properties?.endpoint as any;
    expect(endpointField.type).toBe('string');
    expect(endpointField.description).toContain('endpoint');
  });

  it('should have include_examples field', () => {
    const examplesField = GET_DOCUMENTATION_TOOL.inputSchema.properties?.include_examples as any;
    expect(examplesField.type).toBe('boolean');
  });
});

describe('DOCUMENTATION_CATEGORIES', () => {
  it('should have category definitions', () => {
    expect(Object.keys(DOCUMENTATION_CATEGORIES).length).toBeGreaterThan(0);
  });

  it('should have access category', () => {
    expect(DOCUMENTATION_CATEGORIES).toHaveProperty('access');
    expect(DOCUMENTATION_CATEGORIES.access.url).toContain('yaml');
    expect(DOCUMENTATION_CATEGORIES.access.description).toContain('token');
  });

  it('should have accounts category', () => {
    expect(DOCUMENTATION_CATEGORIES).toHaveProperty('accounts');
    expect(DOCUMENTATION_CATEGORIES.accounts.description).toContain('account');
  });

  it('should have links category', () => {
    expect(DOCUMENTATION_CATEGORIES).toHaveProperty('links');
    expect(DOCUMENTATION_CATEGORIES['links'].description).toContain('payment link');
  });

  it('all categories should have required fields', () => {
    for (const [_, category] of Object.entries(DOCUMENTATION_CATEGORIES)) {
      expect(category).toHaveProperty('url');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('endpoints');
      expect(category.url).toContain('http');
      expect(category.description.length).toBeGreaterThan(0);
      expect(Array.isArray(category.endpoints)).toBe(true);
    }
  });

  it('should have diverse category types', () => {
    const keys = Object.keys(DOCUMENTATION_CATEGORIES);
    expect(keys).toContain('access');
    expect(keys).toContain('accounts');
    expect(keys).toContain('disputes');
    expect(keys).toContain('transactions');
    expect(keys).toContain('links');
  });
});
