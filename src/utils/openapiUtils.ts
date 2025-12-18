/**
 * OpenAPI specification parsing utilities.
 */

import { DOCUMENTATION_CATEGORIES } from '../tools/getDocumentation.js';

/**
 * Extract a list of all endpoints from an OpenAPI specification.
 * 
 * @param spec - Parsed OpenAPI specification object.
 * @returns List of endpoint objects with method, path, summary, and name.
 */
export function extractEndpointsOverview(spec: Record<string, any>): Array<Record<string, any>> {
  const endpoints: Array<Record<string, any>> = [];
  const paths = spec.paths || {};

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods as Record<string, any>)) {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
        endpoints.push({
          method: method.toUpperCase(),
          path,
          name: (details).summary || path,
          summary: (details).summary || '',
          description: (details).description || '',
        });
      }
    }
  }

  return endpoints;
}

/**
 * Extract server information from OpenAPI specification.
 * 
 * @param spec - Parsed OpenAPI specification object.
 * @returns List of server objects with URL and description.
 */
export function extractServers(spec: Record<string, any>): Array<{ url: string; description: string }> {
  const servers = spec.servers || [];
  return servers.map((server: any) => ({
    url: server.url || '',
    description: server.description || '',
  }));
}

/**
 * Extract reusable component schemas from OpenAPI specification.
 * 
 * @param spec - Parsed OpenAPI specification object.
 * @returns Object containing schemas, parameters, responses, and security schemes.
 */
export function extractComponentSchemas(spec: Record<string, any>): Record<string, any> {
  const components = spec.components || {};
  return {
    schemas: components.schemas || {},
    parameters: components.parameters || {},
    responses: components.responses || {},
    securitySchemes: components.securitySchemes || {},
  };
}

/**
 * Format an OpenAPI specification into a category overview.
 * 
 * @param spec - Parsed OpenAPI specification object.
 * @param category - Category key from DOCUMENTATION_CATEGORIES.
 * @returns Structured overview with title, version, servers, and endpoints.
 */
export function formatCategoryOverview(spec: Record<string, any>, category: string): Record<string, any> {
  const info = spec.info || {};

  const overview: Record<string, any> = {
    title: info.title || '',
    version: info.version || '',
    description: DOCUMENTATION_CATEGORIES[category].description,
    servers: extractServers(spec),
    endpoints: extractEndpointsOverview(spec),
    valid_endpoints: DOCUMENTATION_CATEGORIES[category].endpoints,
  };

  if (info.contact) {
    overview.contact = info.contact;
  }

  const components = extractComponentSchemas(spec);
  if (Object.values(components).some(val => Object.keys(val as object).length > 0)) {
    overview.components = components;
  }

  return overview;
}

/**
 * Search for a specific endpoint in the OpenAPI specification.
 * 
 * @param spec - Parsed OpenAPI specification object.
 * @param endpointFilter - Endpoint name or path to search for.
 * @returns Matched endpoint details or null if not found.
 */
export function findEndpointInSpec(spec: Record<string, any>, endpointFilter: string): Record<string, any> | null {
  const endpointLower = endpointFilter.toLowerCase().trim();

  let methodFilter: string | null = null;
  let nameFilter = endpointLower;

  // Check if filter includes HTTP method
  for (const httpMethod of ['get', 'post', 'put', 'patch', 'delete']) {
    if (endpointLower.startsWith(httpMethod + ' ')) {
      methodFilter = httpMethod;
      nameFilter = endpointLower.substring(httpMethod.length + 1).trim();
      break;
    }
  }

  const paths = spec.paths || {};

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods as Record<string, any>)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
        continue;
      }

      // If method filter is specified, skip non-matching methods
      if (methodFilter && method.toLowerCase() !== methodFilter) {
        continue;
      }

      const summary = (details).summary || '';
      const pathLower = path.toLowerCase();
      const summaryLower = summary.toLowerCase();

      // Match by summary, path, or operation ID
      if (summaryLower.includes(nameFilter) || 
          pathLower.includes(nameFilter) || 
          nameFilter.includes(summaryLower)) {
        return {
          path,
          method: method.toUpperCase(),
          details,
        };
      }
    }
  }

  return null;
}

/**
 * Extract schema definition with required field annotations.
 * 
 * @param schema - Schema object from OpenAPI spec.
 * @returns Extracted schema with required fields marked.
 */
export function extractSchemaWithRequired(schema: Record<string, any>): Record<string, any> {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  const extracted: Record<string, any> = {};

  // Copy basic schema properties
  for (const key of ['type', 'description', 'minLength', 'maxLength', 
                      'minimum', 'maximum', 'enum', 'example', 'format', 
                      'title', 'pattern', 'default']) {
    if (key in schema) {
      extracted[key] = schema[key];
    }
  }

  // Handle properties with required field marking
  if ('properties' in schema) {
    const required = schema.required || [];
    extracted.properties = {};
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      extracted.properties[propName] = {
        ...extractSchemaWithRequired(propSchema as Record<string, any>),
        required: required.includes(propName),
      };
    }
  }

  if ('required' in schema) {
    extracted.required = schema.required;
  }

  if ('items' in schema) {
    extracted.items = extractSchemaWithRequired(schema.items);
  }

  if ('oneOf' in schema) {
    extracted.oneOf = schema.oneOf.map((s: any) => extractSchemaWithRequired(s));
  }

  if ('anyOf' in schema) {
    extracted.anyOf = schema.anyOf.map((s: any) => extractSchemaWithRequired(s));
  }

  if ('allOf' in schema) {
    extracted.allOf = schema.allOf.map((s: any) => extractSchemaWithRequired(s));
  }

  return extracted;
}

/**
 * Extract parameters from endpoint details.
 * 
 * @param details - Endpoint details from OpenAPI spec.
 * @returns Categorized parameters (path, query, header).
 */
export function extractParameters(details: Record<string, any>): Record<string, Array<Record<string, any>>> {
  const params = details.parameters || [];
  const categorized: Record<string, Array<Record<string, any>>> = {
    path: [],
    query: [],
    header: [],
  };

  for (const param of params) {
    const paramType = param.in || 'query';
    const paramInfo: Record<string, any> = {
      name: param.name,
      description: param.description || '',
      required: param.required || false,
    };

    if (param.schema) {
      paramInfo.schema = extractSchemaWithRequired(param.schema);
    }

    if (paramType in categorized) {
      categorized[paramType].push(paramInfo);
    }
  }

  return categorized;
}

/**
 * Extract request body schema from endpoint details.
 * 
 * @param details - Endpoint details from OpenAPI spec.
 * @returns Request body schema or null.
 */
export function extractRequestBody(details: Record<string, any>): Record<string, any> | null {
  if (!details.requestBody) {
    return null;
  }

  const content = details.requestBody.content || {};
  const jsonContent = content['application/json'] || {};
  
  return {
    description: details.requestBody.description || '',
    required: details.requestBody.required || false,
    schema: jsonContent.schema ? extractSchemaWithRequired(jsonContent.schema) : null,
  };
}

/**
 * Extract response schemas from endpoint details.
 * 
 * @param details - Endpoint details from OpenAPI spec.
 * @returns Response schemas by status code.
 */
export function extractResponses(details: Record<string, any>): Record<string, any> {
  const responses = details.responses || {};
  const extracted: Record<string, any> = {};

  for (const [statusCode, responseData] of Object.entries(responses)) {
    const content = (responseData as any).content || {};
    const jsonContent = content['application/json'] || {};

    extracted[statusCode] = {
      description: (responseData as any).description || '',
      schema: jsonContent.schema ? extractSchemaWithRequired(jsonContent.schema) : null,
    };
  }

  return extracted;
}

/**
 * Format endpoint details for AI consumption.
 * 
 * @param endpointMatch - Matched endpoint from findEndpointInSpec.
 * @param includeExamples - Whether to include example data.
 * @param spec - Full OpenAPI spec (for resolving references).
 * @returns Formatted endpoint details.
 */
export function formatEndpointDetails(
  endpointMatch: Record<string, any>,
  _includeExamples: boolean,
  _spec?: Record<string, any>
): Record<string, any> {
  const { path, method, details } = endpointMatch;

  const formatted: Record<string, any> = {
    path,
    method,
    summary: details.summary || '',
    description: details.description || '',
    parameters: extractParameters(details),
    requestBody: extractRequestBody(details),
    responses: extractResponses(details),
  };

  if (details.security) {
    formatted.security = details.security;
  }

  if (details.tags) {
    formatted.tags = details.tags;
  }

  return formatted;
}
