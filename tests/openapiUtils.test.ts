/**
 * Tests for OpenAPI utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  extractEndpointsOverview,
  extractServers,
  extractComponentSchemas,
  formatCategoryOverview,
  findEndpointInSpec,
  extractSchemaWithRequired,
  extractParameters,
  extractRequestBody,
  extractResponses,
  formatEndpointDetails,
} from '../src/utils/openapiUtils.js';

describe('extractEndpointsOverview', () => {
  it('should extract endpoints from OpenAPI spec', () => {
    const spec = {
      paths: {
        '/users': {
          get: {
            summary: 'List users',
            description: 'Get all users',
          },
          post: {
            summary: 'Create user',
          },
        },
        '/users/{id}': {
          delete: {
            summary: 'Delete user',
          },
        },
      },
    };

    const endpoints = extractEndpointsOverview(spec);
    expect(endpoints).toHaveLength(3);
    expect(endpoints[0]).toMatchObject({
      method: 'GET',
      path: '/users',
      name: 'List users',
      summary: 'List users',
      description: 'Get all users',
    });
    expect(endpoints[1]).toMatchObject({
      method: 'POST',
      path: '/users',
    });
    expect(endpoints[2]).toMatchObject({
      method: 'DELETE',
      path: '/users/{id}',
    });
  });

  it('should handle empty paths', () => {
    const spec = { paths: {} };
    expect(extractEndpointsOverview(spec)).toEqual([]);
  });

  it('should handle missing paths property', () => {
    const spec = {};
    expect(extractEndpointsOverview(spec)).toEqual([]);
  });

  it('should only include valid HTTP methods', () => {
    const spec = {
      paths: {
        '/test': {
          get: { summary: 'GET endpoint' },
          parameters: [{ name: 'id' }], // Not an HTTP method
          servers: [], // Not an HTTP method
        },
      },
    };

    const endpoints = extractEndpointsOverview(spec);
    expect(endpoints).toHaveLength(1);
    expect(endpoints[0].method).toBe('GET');
  });
});

describe('extractServers', () => {
  it('should extract server information', () => {
    const spec = {
      servers: [
        { url: 'https://api.example.com', description: 'Production' },
        { url: 'https://sandbox.example.com', description: 'Sandbox' },
      ],
    };

    const servers = extractServers(spec);
    expect(servers).toHaveLength(2);
    expect(servers[0]).toEqual({
      url: 'https://api.example.com',
      description: 'Production',
    });
    expect(servers[1]).toEqual({
      url: 'https://sandbox.example.com',
      description: 'Sandbox',
    });
  });

  it('should handle missing servers', () => {
    const spec = {};
    expect(extractServers(spec)).toEqual([]);
  });

  it('should handle servers with missing fields', () => {
    const spec = {
      servers: [{ url: 'https://api.example.com' }, { description: 'Test' }],
    };

    const servers = extractServers(spec);
    expect(servers[0]).toEqual({ url: 'https://api.example.com', description: '' });
    expect(servers[1]).toEqual({ url: '', description: 'Test' });
  });
});

describe('extractComponentSchemas', () => {
  it('should extract component schemas', () => {
    const spec = {
      components: {
        schemas: {
          User: { type: 'object', properties: { name: { type: 'string' } } },
        },
        parameters: {
          PageParam: { name: 'page', in: 'query', schema: { type: 'integer' } },
        },
        responses: {
          NotFound: { description: 'Not found' },
        },
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer' },
        },
      },
    };

    const components = extractComponentSchemas(spec);
    expect(components.schemas).toHaveProperty('User');
    expect(components.parameters).toHaveProperty('PageParam');
    expect(components.responses).toHaveProperty('NotFound');
    expect(components.securitySchemes).toHaveProperty('bearerAuth');
  });

  it('should handle missing components', () => {
    const spec = {};
    const components = extractComponentSchemas(spec);
    expect(components.schemas).toEqual({});
    expect(components.parameters).toEqual({});
    expect(components.responses).toEqual({});
    expect(components.securitySchemes).toEqual({});
  });
});

describe('formatCategoryOverview', () => {
  it('should format category overview', () => {
    const spec = {
      info: {
        title: 'Test API',
        version: '1.0.0',
        contact: { email: 'test@example.com' },
      },
      servers: [{ url: 'https://api.example.com' }],
      paths: {
        '/test': {
          get: { summary: 'Test endpoint' },
        },
      },
      components: {
        schemas: {
          TestSchema: { type: 'object' },
        },
      },
    };

    const overview = formatCategoryOverview(spec, 'access');
    expect(overview.title).toBe('Test API');
    expect(overview.version).toBe('1.0.0');
    expect(overview.contact).toEqual({ email: 'test@example.com' });
    expect(overview.servers).toHaveLength(1);
    expect(overview.endpoints).toHaveLength(1);
    expect(overview.components).toBeDefined();
    expect(overview.description).toContain('Access token');
  });

  it('should handle minimal spec', () => {
    const spec = { info: {} };
    const overview = formatCategoryOverview(spec, 'batches');
    expect(overview.title).toBe('');
    expect(overview.version).toBe('');
    expect(overview.description).toContain('Batch');
  });
});

describe('findEndpointInSpec', () => {
  const spec = {
    paths: {
      '/users': {
        get: {
          summary: 'List all users',
          description: 'Returns a list of users',
        },
        post: {
          summary: 'Create a user',
        },
      },
      '/users/{id}': {
        get: {
          summary: 'Get user by ID',
        },
      },
    },
  };

  it('should find endpoint by summary', () => {
    const result = findEndpointInSpec(spec, 'list all users');
    expect(result).not.toBeNull();
    expect(result?.path).toBe('/users');
    expect(result?.method).toBe('GET');
  });

  it('should find endpoint by path', () => {
    const result = findEndpointInSpec(spec, '/users/{id}');
    expect(result).not.toBeNull();
    expect(result?.path).toBe('/users/{id}');
  });

  it('should find endpoint with method filter', () => {
    const result = findEndpointInSpec(spec, 'post user');
    expect(result).not.toBeNull();
    expect(result?.method).toBe('POST');
    expect(result?.path).toBe('/users');
  });

  it('should return null for non-existent endpoint', () => {
    const result = findEndpointInSpec(spec, 'nonexistent endpoint');
    expect(result).toBeNull();
  });

  it('should handle case-insensitive search', () => {
    const result = findEndpointInSpec(spec, 'LIST ALL USERS');
    expect(result).not.toBeNull();
  });
});

describe('extractSchemaWithRequired', () => {
  it('should extract schema with basic properties', () => {
    const schema = {
      type: 'string',
      description: 'A string field',
      minLength: 1,
      maxLength: 100,
      pattern: '^[a-z]+$',
    };

    const extracted = extractSchemaWithRequired(schema);
    expect(extracted.type).toBe('string');
    expect(extracted.description).toBe('A string field');
    expect(extracted.minLength).toBe(1);
    expect(extracted.maxLength).toBe(100);
    expect(extracted.pattern).toBe('^[a-z]+$');
  });

  it('should mark required properties', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        email: { type: 'string' },
      },
      required: ['name', 'email'],
    };

    const extracted = extractSchemaWithRequired(schema);
    expect(extracted.properties.name.required).toBe(true);
    expect(extracted.properties.age.required).toBe(false);
    expect(extracted.properties.email.required).toBe(true);
  });

  it('should handle array items', () => {
    const schema = {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
    };

    const extracted = extractSchemaWithRequired(schema);
    expect(extracted.items.type).toBe('string');
    expect(extracted.items.minLength).toBe(1);
  });

  it('should handle oneOf/anyOf/allOf', () => {
    const schema = {
      oneOf: [{ type: 'string' }, { type: 'number' }],
    };

    const extracted = extractSchemaWithRequired(schema);
    expect(extracted.oneOf).toHaveLength(2);
    expect(extracted.oneOf[0].type).toBe('string');
    expect(extracted.oneOf[1].type).toBe('number');
  });

  it('should handle null/undefined input', () => {
    expect(extractSchemaWithRequired(null as any)).toBeNull();
    expect(extractSchemaWithRequired(undefined as any)).toBeUndefined();
  });
});

describe('extractParameters', () => {
  it('should categorize parameters by type', () => {
    const details = {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
        { name: 'Authorization', in: 'header', required: true, schema: { type: 'string' } },
      ],
    };

    const params = extractParameters(details);
    expect(params.path).toHaveLength(1);
    expect(params.query).toHaveLength(1);
    expect(params.header).toHaveLength(1);
    expect(params.path[0].name).toBe('id');
    expect(params.path[0].required).toBe(true);
  });

  it('should handle missing parameters', () => {
    const details = {};
    const params = extractParameters(details);
    expect(params.path).toEqual([]);
    expect(params.query).toEqual([]);
    expect(params.header).toEqual([]);
  });
});

describe('extractRequestBody', () => {
  it('should extract request body schema', () => {
    const details = {
      requestBody: {
        description: 'User data',
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
          },
        },
      },
    };

    const body = extractRequestBody(details);
    expect(body).not.toBeNull();
    expect(body?.description).toBe('User data');
    expect(body?.required).toBe(true);
    expect(body?.schema.type).toBe('object');
  });

  it('should return null when no request body', () => {
    const details = {};
    expect(extractRequestBody(details)).toBeNull();
  });
});

describe('extractResponses', () => {
  it('should extract response schemas', () => {
    const details = {
      responses: {
        '200': {
          description: 'Success',
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        '404': {
          description: 'Not found',
        },
      },
    };

    const responses = extractResponses(details);
    expect(responses['200'].description).toBe('Success');
    expect(responses['200'].schema.type).toBe('object');
    expect(responses['404'].description).toBe('Not found');
    expect(responses['404'].schema).toBeNull();
  });

  it('should handle missing responses', () => {
    const details = {};
    const responses = extractResponses(details);
    expect(responses).toEqual({});
  });
});

describe('formatEndpointDetails', () => {
  it('should format complete endpoint details', () => {
    const endpointMatch = {
      path: '/users/{id}',
      method: 'GET',
      details: {
        summary: 'Get user',
        description: 'Returns a user by ID',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
        ],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
        },
        security: [{ bearerAuth: [] }],
        tags: ['users'],
      },
    };

    const formatted = formatEndpointDetails(endpointMatch, true);
    expect(formatted.path).toBe('/users/{id}');
    expect(formatted.method).toBe('GET');
    expect(formatted.summary).toBe('Get user');
    expect(formatted.description).toBe('Returns a user by ID');
    expect(formatted.parameters).toBeDefined();
    expect(formatted.responses).toBeDefined();
    expect(formatted.security).toEqual([{ bearerAuth: [] }]);
    expect(formatted.tags).toEqual(['users']);
  });

  it('should handle minimal endpoint', () => {
    const endpointMatch = {
      path: '/test',
      method: 'GET',
      details: {},
    };

    const formatted = formatEndpointDetails(endpointMatch, false);
    expect(formatted.path).toBe('/test');
    expect(formatted.method).toBe('GET');
    expect(formatted.summary).toBe('');
    expect(formatted.requestBody).toBeNull();
  });
});
