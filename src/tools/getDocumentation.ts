/**
 * Get documentation tool for GPAPI MCP Server.
 */

import { Tool, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { DocumentationClient, DocumentationError } from '../clients/documentationClient.js';
import {
  ErrorCode,
  ValidationError,
  createErrorResponse,
  createSuccessResponse,
  logError,
} from '../utils/errors.js';
import {
  CONTEXT_DOCUMENTATION_VALIDATION,
  CONTEXT_GET_DOCUMENTATION,
} from '../utils/constants.js';

/**
 * Documentation categories with their OpenAPI specification URLs and endpoints.
 */
export const DOCUMENTATION_CATEGORIES: Record<string, {
  url: string;
  description: string;
  endpoints: string[];
}> = {
  'access-token': {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/access-deref_0.yaml',
    description: 'Access token management - OAuth authentication and token creation',
    endpoints: ['POST Create Access Token'],
  },
  accounts: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/accounts-deref_2.yaml',
    description: 'Merchant account management - account details, configuration, and settings',
    endpoints: ['GET Get Merchant\'s Account info', 'PATCH Edit a Merchant\'s Account info', 'GET Get info about a Single Account', 'GET Get FMA Account Details'],
  },
  actions: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/actions_deref.yaml',
    description: 'Action history and audit logs - track API actions and operations',
    endpoints: ['GET Get a list of Actions', 'GET Get a Single Action'],
  },
  auth3DS: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/auth_deref_13.yaml',
    description: '3D Secure authentication - EMV 3DS authentication flows and management',
    endpoints: ['POST Check Availability', 'GET Get List of Authentications', 'POST Initiate', 'GET Obtain Result', 'GET Get Single Authentication'],
  },
  batches: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/batches_deref_8.yaml',
    description: 'Batch transaction processing - group transactions and batch settlement',
    endpoints: ['GET Get a Batch', 'POST Close a Batch', 'GET Get Transactions Within a Batch'],
  },
  'currency-conversion': {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/Currency-Conversion-2021-03-22.v1_0.yaml',
    description: 'Dynamic Currency Conversion (DCC) - multi-currency transaction support',
    endpoints: ['POST Convert Transaction Amount', 'GET BIN Ranges List Download'],
  },
  disputes: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/disputes_deref_6.yaml',
    description: 'Dispute and chargeback management - handle transaction disputes and chargebacks',
    endpoints: ['GET List Disputes', 'GET Get a Dispute', 'POST Accept', 'POST Challenge', 'POST Download Document'],
  },
  funds: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/funds-deref_4.yaml',
    description: 'Funds management - merchant balance, transfers, and payout operations',
    endpoints: ['POST Credit Or Debit a Funds Management Account (FMA)', 'GET Get a Fund', 'GET List Funds'],
  },
  installments: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/inst_deref.yaml',
    description: 'Installment payment programs - enable customers to pay in installments',
    endpoints: ['POST Create an Installment'],
  },
  links: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/link_deref_1.yaml',
    description: 'Payment links - create, manage, and track hosted payment links',
    endpoints: ['GET Get a list of Links', 'POST Create a link', 'GET Get a link'],
  },
  merchants: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/merchant_deref.yaml',
    description: 'Merchant onboarding and management - create and manage merchant accounts',
    endpoints: ['POST Board Merchant', 'GET Get Merchants', 'PATCH Edit Merchant', 'GET Get Merchant info', 'POST Upload Merchant Documentation', 'GET Address Lookup'],
  },
  payers: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/payers_deref.yaml',
    description: 'Payer/customer management - store and manage customer information',
    endpoints: ['POST Create a Payer', 'GET Get Payers List', 'PATCH Edit a Payer', 'GET Get a Payer'],
  },
  reports: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/report_deref.yaml',
    description: 'Reporting and analytics - transaction reports, settlement data, and analytics',
    endpoints: ['GET Get a Transaction Summary Report'],
  },
  orders: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/orders_deref_0.yaml',
    description: 'Order management - create and track orders with line items',
    endpoints: ['POST Create an Order', 'GET Get Orders', 'GET Get an Order', 'POST Complete an Order'],
  },
  'payment-methods': {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/payment-methods_deref_0.yaml',
    description: 'Payment method management - cards, bank accounts, and alternative payment methods',
    endpoints: ['POST Create', 'GET List Payment Methods', 'GET Get a Payment Method', 'PATCH Edit a Payment Method', 'DELETE Delete a Payment Method', 'POST Detokenize a Payment Method', 'POST Search for a Payment Method'],
  },
  settled: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/settled_deref_0.yaml',
    description: 'Settlement data - settled transactions and deposit information',
    endpoints: ['GET Get a list of Monthly Fee Reports', 'GET List Settled Disputes', 'GET List Settled Transactions', 'GET Get a list of Deposit information', 'GET Get a Single Deposit'],
  },
  transactions: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/trans_deref_22.yaml',
    description: 'Transaction processing - charges, refunds, captures, authorizations, and voids',
    endpoints: ['POST Create a Sale or Refund', 'GET List Transactions', 'GET Get a Transaction', 'POST Refund a Sale', 'POST Reverse a Sale or Refund', 'POST Capture a Sale', 'POST Increment an Auth', 'POST Adjust a CP Sale', 'POST ReAuth a Reversed Sale', 'POST Confirm a Transaction', 'POST Split a Transaction Amount', 'POST Synchronize a Device', 'POST Challenge a Disputed Transaction', 'POST Hold a Transaction', 'POST Release a Transaction'],
  },
  transfers: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/transfers-deref_3.yaml',
    description: 'Fund transfers - move funds between accounts and merchants',
    endpoints: ['POST Transfer Funds', 'POST Reverse A Transfer', 'GET Get a Transfer', 'GET List Transfers'],
  },
  verifications: {
    url: 'https://developer.globalpay.com/sites/default/files/apidoc_specs/verifications_deref_1.yaml',
    description: 'Card verification - verify payment methods without charging',
    endpoints: ['POST Verify'],
  },
};

/**
 * Check if a property name is safe to use (not a prototype pollution vector).
 * 
 * @param propertyName - Property name to validate.
 * @returns True if the property name is safe to use.
 */
function isSafePropertyName(propertyName: string): boolean {
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  return !dangerousKeys.includes(propertyName);
}

/**
 * Extract a list of all endpoints from an OpenAPI specification.
 * 
 * @param spec - Parsed OpenAPI specification object.
 * @returns List of endpoint objects with method, path, summary, and description.
 */
function extractEndpointsOverview(spec: Record<string, any>): Array<Record<string, any>> {
  const endpoints: Array<Record<string, any>> = [];
  const paths = spec.paths || {};

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods as Record<string, any>)) {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
        endpoints.push({
          method: method.toUpperCase(),
          path,
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
function extractServers(spec: Record<string, any>): Array<{ url: string; description: string }> {
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
function extractComponentSchemas(spec: Record<string, any>): Record<string, any> {
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
function formatCategoryOverview(spec: Record<string, any>, category: string): Record<string, any> {
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
 * Performs exact matching on HTTP METHOD + tag combination.
 * Expected format: "METHOD Tag Name" (e.g., "POST Create a Link", "GET Get Transaction")
 * 
 * @param spec - Parsed OpenAPI specification object.
 * @param endpointFilter - Endpoint in "METHOD Tag" format for exact matching.
 * @returns Object with method, path, and details if found, null otherwise.
 */
function findEndpointInSpec(
  spec: Record<string, any>,
  endpointFilter: string
): { method: string; path: string; details: Record<string, any> } | null {
  const filterTrimmed = endpointFilter.trim();

  // Extract METHOD from the filter
  let methodFilter: string | null = null;
  let tagFilter = filterTrimmed;

  for (const httpMethod of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
    if (filterTrimmed.toUpperCase().startsWith(httpMethod + ' ')) {
      methodFilter = httpMethod;
      tagFilter = filterTrimmed.slice(httpMethod.length).trim();
      break;
    }
  }

  const paths = spec.paths || {};

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, details] of Object.entries(methods as Record<string, any>)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
        continue;
      }

      // If method specified in filter, it must match exactly
      if (methodFilter && method.toUpperCase() !== methodFilter) {
        continue;
      }

      // Get tags array from the endpoint
      const tags = (details as Record<string, any>).tags || [];
      
      // Check for exact tag match (case-sensitive)
      for (const tag of tags) {
        if (tag === tagFilter) {
          return {
            method: method.toUpperCase(),
            path,
            details: details as Record<string, any>,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Extract schema definition with required field annotations.
 * 
 * Recursively processes schema objects to include required field markers
 * directly on property definitions for easier interpretation.
 * 
 * @param schema - OpenAPI schema object to process.
 * @returns Processed schema with required annotations on properties.
 */
function extractSchemaWithRequired(schema: any): Record<string, any> {
  if (typeof schema !== 'object' || schema === null) {
    return schema;
  }

  const extracted: Record<string, any> = {};

  const simpleFields = [
    'type', 'description', 'minLength', 'maxLength',
    'minimum', 'maximum', 'enum', 'example', 'format',
    'title', 'pattern', 'default',
  ];

  for (const key of simpleFields) {
    if (key in schema) {
      extracted[key] = schema[key];
    }
  }

  if ('properties' in schema) {
    extracted.properties = Object.create(null);
    const requiredFields = new Set(schema.required || []);

    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (!isSafePropertyName(propName)) {
        continue;
      }
      extracted.properties[propName] = extractSchemaWithRequired(propSchema);
      if (requiredFields.has(propName)) {
        extracted.properties[propName].required = true;
      }
    }
  }

  if ('required' in schema) {
    extracted.required = schema.required;
  }

  if ('items' in schema) {
    extracted.items = extractSchemaWithRequired(schema.items);
  }

  if ('oneOf' in schema) {
    extracted.oneOf = schema.oneOf.map(extractSchemaWithRequired);
  }

  if ('anyOf' in schema) {
    extracted.anyOf = schema.anyOf.map(extractSchemaWithRequired);
  }

  if ('allOf' in schema) {
    extracted.allOf = schema.allOf.map(extractSchemaWithRequired);
  }

  return extracted;
}

/**
 * Extract and organize endpoint parameters by location.
 * 
 * Groups parameters into path, query, and header categories for
 * easier consumption by AI agents.
 * 
 * @param details - OpenAPI endpoint details object.
 * @returns Object with 'path', 'query', and 'header' parameter lists.
 */
function extractParameters(details: Record<string, any>): Record<string, Array<Record<string, any>>> {
  const parameters = details.parameters || [];

  const paramsByLocation: Record<string, Array<Record<string, any>>> = {
    path: [],
    query: [],
    header: [],
  };

  for (const param of parameters) {
    const location = param.in || '';
    if (location in paramsByLocation && isSafePropertyName(location)) {
      const paramInfo: Record<string, any> = {
        name: param.name || '',
        required: param.required || false,
        description: param.description || '',
        schema: param.schema || {},
      };

      if ('deprecated' in param) {
        paramInfo.deprecated = param.deprecated;
      }
      if ('style' in param) {
        paramInfo.style = param.style;
      }
      if ('explode' in param) {
        paramInfo.explode = param.explode;
      }

      paramsByLocation[location].push(paramInfo);
    }
  }

  return paramsByLocation;
}

/**
 * Extract request body schema from endpoint details.
 * 
 * Focuses on application/json content type and extracts the schema
 * with required field annotations.
 * 
 * @param details - OpenAPI endpoint details object.
 * @returns Request body information with schema, or null if no body expected.
 */
function extractRequestBody(details: Record<string, any>): Record<string, any> | null {
  const requestBody = details.requestBody;
  if (!requestBody) {
    return null;
  }

  const content = requestBody.content || {};
  const jsonContent = content['application/json'] || {};

  return {
    required: requestBody.required || false,
    description: requestBody.description || '',
    schema: extractSchemaWithRequired(jsonContent.schema || {}),
  };
}

/**
 * Extract response header definitions from endpoint response.
 * 
 * Handles nested header schemas and normalizes their structure.
 * 
 * @param responseData - OpenAPI response object.
 * @returns Object of header definitions by name.
 */
function extractResponseHeaders(responseData: Record<string, any>): Record<string, any> {
  const headers = responseData.headers || {};

  const formattedHeaders: Record<string, any> = {};
  for (const [headerName, headerSpec] of Object.entries(headers)) {
    const spec = headerSpec as Record<string, any>;
    const schema = spec.schema || {};

    let headerInfo: Record<string, any>;

    if (typeof schema === 'object' && 'schema' in schema) {
      const innerSchema = schema.schema || {};
      const description = schema.description || spec.description || '';
      const required = schema.required || spec.required || false;
      const name = schema.name || headerName;

      headerInfo = {
        name,
        description,
        schema: innerSchema,
        required,
      };
    } else {
      headerInfo = {
        name: headerName,
        description: spec.description || '',
        schema,
      };

      if ('required' in spec) {
        headerInfo.required = spec.required;
      }
    }

    if ('deprecated' in spec) {
      headerInfo.deprecated = spec.deprecated;
    }

    if (isSafePropertyName(headerName)) {
      formattedHeaders[headerName] = headerInfo;
    }
  }

  return formattedHeaders;
}

/**
 * Extract all response definitions from an endpoint.
 * 
 * Processes each status code's response schema and headers.
 * 
 * @param details - OpenAPI endpoint details object.
 * @returns Object mapping status codes to response information.
 */
function extractResponses(details: Record<string, any>): Record<string, any> {
  const responses = details.responses || {};

  const formattedResponses: Record<string, any> = {};
  for (const [statusCode, responseData] of Object.entries(responses)) {
    const data = responseData as Record<string, any>;
    const content = data.content || {};
    const jsonContent = content['application/json'] || {};

    const responseInfo: Record<string, any> = {
      description: data.description || '',
      schema: extractSchemaWithRequired(jsonContent.schema || {}),
    };

    const headers = extractResponseHeaders(data);
    if (Object.keys(headers).length > 0) {
      responseInfo.headers = headers;
    }

    if (isSafePropertyName(statusCode)) {
      formattedResponses[statusCode] = responseInfo;
    }
  }

  return formattedResponses;
}

/**
 * Extract request and response examples from endpoint details.
 * 
 * Gathers example data for both request bodies and response payloads
 * when available in the OpenAPI specification.
 * 
 * @param details - OpenAPI endpoint details object.
 * @param includeExamples - Whether to extract examples or skip them.
 * @returns Object with 'request' and 'responses' examples, or null.
 */
function extractExamples(
  details: Record<string, any>,
  includeExamples: boolean
): Record<string, any> | null {
  if (!includeExamples) {
    return null;
  }

  const allExamples: Record<string, any> = {
    request: {},
    responses: Object.create(null),
  };

  const requestBody = details.requestBody || {};
  const content = requestBody.content || {};
  const jsonContent = content['application/json'] || {};

  if ('examples' in jsonContent) {
    for (const [exampleName, exampleData] of Object.entries(jsonContent.examples)) {
      if (!isSafePropertyName(exampleName)) {
        continue;
      }
      const data = exampleData as Record<string, any>;
      allExamples.request[exampleName] = {
        summary: data.summary || '',
        description: data.description || '',
        value: data.value || {},
      };
    }
  } else if ('example' in jsonContent) {
    allExamples.request.default = {
      value: jsonContent.example,
    };
  }

  const responses = details.responses || {};
  for (const [statusCode, responseData] of Object.entries(responses)) {
    const data = responseData as Record<string, any>;
    const responseContent = data.content || {};
    const responseJson = responseContent['application/json'] || {};

    if ('examples' in responseJson) {
      if (!isSafePropertyName(statusCode)) {
        continue;
      }
      allExamples.responses[statusCode] = Object.create(null);
      for (const [exampleName, exampleData] of Object.entries(responseJson.examples)) {
        if (!isSafePropertyName(exampleName)) {
          continue;
        }
        const exData = exampleData as Record<string, any>;
        allExamples.responses[statusCode][exampleName] = {
          summary: exData.summary || '',
          description: exData.description || '',
          value: exData.value || {},
        };
      }
    } else if ('example' in responseJson) {
      if (isSafePropertyName(statusCode)) {
        allExamples.responses[statusCode] = {
          default: { value: responseJson.example },
        };
      }
    }
  }

  if (Object.keys(allExamples.request).length === 0) {
    delete allExamples.request;
  }
  if (Object.keys(allExamples.responses).length === 0) {
    delete allExamples.responses;
  }

  return Object.keys(allExamples).length > 0 ? allExamples : null;
}

/**
 * Format endpoint information into a structured documentation response.
 * 
 * Combines parameters, request body, responses, security, and examples
 * into a comprehensive endpoint documentation object.
 * 
 * @param endpointMatch - Matched endpoint from spec search.
 * @param includeExamples - Whether to include request/response examples.
 * @param spec - Full OpenAPI spec for server URL fallback.
 * @returns Formatted endpoint documentation object.
 */
function formatEndpointDetails(
  endpointMatch: { method: string; path: string; details: Record<string, any> },
  includeExamples: boolean,
  spec?: Record<string, any>
): Record<string, any> {
  const { method, path, details } = endpointMatch;

  const endpointDoc: Record<string, any> = {
    method,
    path,
    summary: details.summary || '',
    description: details.description || '',
    parameters: extractParameters(details),
  };

  if (details.operationId) {
    endpointDoc.operationId = details.operationId;
  }

  if (details.tags) {
    endpointDoc.tags = details.tags;
  }

  if (details.deprecated) {
    endpointDoc.deprecated = details.deprecated;
  }

  const requestBody = extractRequestBody(details);
  if (requestBody) {
    endpointDoc.request_body = requestBody;
  }

  endpointDoc.responses = extractResponses(details);

  if (details.security) {
    endpointDoc.security = details.security;
  }

  let servers = details.servers;
  if (!servers && spec) {
    servers = spec.servers;
  }
  if (servers) {
    endpointDoc.servers = servers.map((server: any) => ({
      url: server.url || '',
      description: server.description || '',
    }));
  }

  const examples = extractExamples(details, includeExamples);
  if (examples) {
    endpointDoc.examples = examples;
  }

  return endpointDoc;
}

/**
 * Handle the get_documentation tool invocation.
 * 
 * Fetches OpenAPI specifications for Global Payments API categories,
 * optionally filtering to specific endpoints, and returns formatted
 * documentation with schemas and examples.
 * 
 * @param arguments_ - Tool arguments with category, optional endpoint, and include_examples.
 * @param docClient - DocumentationClient instance for fetching specs.
 * @returns Array containing a single TextContent with documentation or error response.
 */
export async function handleGetDocumentation(
  arguments_: Record<string, any>,
  docClient: DocumentationClient
): Promise<TextContent[]> {
  try {
    const category = arguments_.category;
    const endpointFilter = arguments_.endpoint;
    const includeExamples = arguments_.include_examples !== false;

    if (!(category in DOCUMENTATION_CATEGORIES)) {
      const error = new ValidationError(
        `Invalid category: ${category}`,
        'category',
        {
          provided_value: category,
          valid_categories: Object.keys(DOCUMENTATION_CATEGORIES),
        }
      );
      return [error.toTextContent()];
    }

    const categoryInfo = DOCUMENTATION_CATEGORIES[category];

    if (endpointFilter) {
      const validEndpoints = categoryInfo.endpoints;

      // Exact match validation - check if the provided endpoint exists in valid endpoints
      const isValid = validEndpoints.includes(endpointFilter);

      if (!isValid) {
        const error = new ValidationError(
          `Invalid endpoint '${endpointFilter}' for category '${category}'`,
          'endpoint',
          {
            provided_value: endpointFilter,
            valid_endpoints: validEndpoints,
            hint: 'Endpoint must exactly match "METHOD Tag" format (case-sensitive)',
          }
        );
        return [error.toTextContent()];
      }
    }

    const spec = await docClient.fetchDocumentation(categoryInfo.url);

    if (!endpointFilter) {
      const overview = formatCategoryOverview(spec, category);
      const responseData = {
        success: true,
        category,
        documentation: overview,
      };
      return [createSuccessResponse(responseData)];
    }

    const endpointMatch = findEndpointInSpec(spec, endpointFilter);

    if (!endpointMatch) {
      const availableEndpoints = extractEndpointsOverview(spec);
      const error = new ValidationError(
        `Endpoint '${endpointFilter}' not found in ${category} API specification`,
        'endpoint',
        {
          provided_value: endpointFilter,
          available_endpoints: availableEndpoints,
          hint: 'Try using one of the available endpoints or search by operation summary',
        }
      );
      return [error.toTextContent()];
    }

    const endpointDetails = formatEndpointDetails(endpointMatch, includeExamples, spec);

    const responseData = {
      success: true,
      category,
      endpoint: endpointDetails,
    };

    return [createSuccessResponse(responseData)];

  } catch (error) {
    if (error instanceof ValidationError) {
      logError(error, CONTEXT_DOCUMENTATION_VALIDATION, false);
      return [error.toTextContent()];
    }

    if (error instanceof DocumentationError) {
      logError(error, CONTEXT_GET_DOCUMENTATION, false);
      return [error.toTextContent()];
    }

    logError(error as Error, CONTEXT_GET_DOCUMENTATION, true);
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      `Failed to retrieve documentation: ${(error as Error).message}`,
      { error_type: (error as Error).constructor.name }
    );
    return [errorResponse];
  }
}

/**
 * Build the MCP tool definition for get_documentation.
 * 
 * Dynamically generates the tool schema with all available API
 * categories and endpoint options from DOCUMENTATION_CATEGORIES.
 * 
 * @returns Tool definition for the get_documentation tool.
 */
export function buildGetDocumentationTool(): Tool {
  const allEndpoints: string[] = [];
  for (const categoryInfo of Object.values(DOCUMENTATION_CATEGORIES)) {
    allEndpoints.push(...categoryInfo.endpoints);
  }

  const uniqueEndpoints = Array.from(new Set(allEndpoints)).sort();

  return {
    name: 'get_documentation',
    description: 'Retrieve Global Payments API documentation for specific API categories. Returns OpenAPI specification details including endpoints, request/response schemas, authentication requirements, and usage examples.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'The API category to retrieve documentation for',
          enum: Object.keys(DOCUMENTATION_CATEGORIES),
        },
        endpoint: {
          type: 'string',
          description: 'Optional: Specific endpoint to filter documentation. Must be one of the valid endpoints for the selected category.',
          enum: uniqueEndpoints,
        },
        include_examples: {
          type: 'boolean',
          description: 'Include request/response examples from the OpenAPI spec',
          default: true,
        },
      },
      required: ['category'],
    },
  };
}

export const GET_DOCUMENTATION_TOOL = buildGetDocumentationTool();
