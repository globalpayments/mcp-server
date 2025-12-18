/**
 * Get payment links tool for GPAPI MCP Server.
 */

import { Tool, TextContent } from '@modelcontextprotocol/sdk/types.js';
import type { GPAPIClient } from '../clients/client.js';
import {
  ErrorCode,
  ValidationError,
  APIError,
  createErrorResponse,
  createSuccessResponse,
  logError,
} from '../utils/errors.js';
import {
  validateToolArgumentsNoCardNumbers,
  CardNumberDetectedError,
  validateNoCardNumbers,
} from '../utils/index.js';
import {
  validateAmount,
  validateCountryCode,
  validateCurrencyCode,
  validateDateFormat,
  validateEnumValue,
  validatePageNumber,
  validatePageSize,
} from '../utils/validators.js';
import {
  ENDPOINT_LINKS,
  LINK_STATUSES,
  USAGE_MODES,
  SHIPPABLE_VALUES,
  ORDER_VALUES,
  CONTEXT_GET_LINKS,
  CONTEXT_GET_LINKS_VALIDATION,
  ERROR_MSG_SECURITY_VIOLATION_PARAMS,
  CONTEXT_API_REQUEST_PARAMS,
} from '../utils/constants.js';

/**
 * Tool definition for retrieving payment links.
 */
export const GET_LINKS_TOOL: Tool = {
  name: 'get_links',
  description: 'Retrieve payment link(s) from Global Payments API. Can fetch a single link by ID or query multiple links with filters. Returns link details including URL, status, amount, and usage information.',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Payment link ID to retrieve a single specific link. If provided, all other parameters are ignored.',
      },
      from_time_created: {
        type: 'string',
        format: 'date',
        description: 'Filter links created on or after this date (YYYY-MM-DD format). Example: "2024-01-01"',
      },
      to_time_created: {
        type: 'string',
        format: 'date',
        description: 'Filter links created on or before this date (YYYY-MM-DD format). Example: "2024-12-31"',
      },
      status: {
        type: 'string',
        enum: LINK_STATUSES,
        description: 'Filter by payment link status. Options: ACTIVE, CLOSED, PAID, INACTIVE, EXPIRED',
      },
      usage_mode: {
        type: 'string',
        enum: USAGE_MODES,
        description: 'Filter by usage mode. SINGLE = one-time use, MULTIPLE = reusable',
      },
      name: {
        type: 'string',
        description: 'Filter by payment link name (partial match supported)',
      },
      description: {
        type: 'string',
        description: 'Filter by payment link description (partial match supported)',
      },
      reference: {
        type: 'string',
        description: 'Filter by your internal reference ID',
      },
      country: {
        type: 'string',
        pattern: '^[A-Z]{2}$',
        description: 'Filter by country code (ISO 3166-1). Example: "US", "GB"',
      },
      amount: {
        type: 'string',
        description: 'Filter by exact payment amount in smallest currency unit',
      },
      currency: {
        type: 'string',
        pattern: '^[A-Z]{3}$',
        description: 'Filter by currency code (ISO 4217). Example: "USD", "EUR"',
      },
      shippable: {
        type: 'string',
        enum: SHIPPABLE_VALUES,
        description: 'Filter by whether links allow shipping. Options: YES, NO',
      },
      expiration_date: {
        type: 'string',
        format: 'date',
        description: 'Filter by expiration date (YYYY-MM-DD format)',
      },
      page: {
        type: 'integer',
        minimum: 1,
        description: 'Page number for pagination (starts at 1). Default: 1',
      },
      page_size: {
        type: 'integer',
        minimum: 1,
        maximum: 1000,
        description: 'Number of results per page (1-1000).',
      },
      order_by: {
        type: 'string',
        description: 'Field name to sort results by. Example: "time_created", "status"',
      },
      order: {
        type: 'string',
        enum: ORDER_VALUES,
        description: 'Sort direction. ASC = ascending, DESC = descending',
      },
    },
    required: [],
  },
};

/**
 * Handle the get_links tool execution.
 * 
 * @param arguments_ - Tool arguments from the AI agent.
 * @param apiClient - Configured GPAPIClient instance.
 * @returns List of TextContent responses.
 */
export async function handleGetLinks(
  arguments_: Record<string, any>,
  apiClient: GPAPIClient
): Promise<TextContent[]> {
  try {
    // Validate no card numbers in input arguments
    try {
      validateToolArgumentsNoCardNumbers(arguments_);
    } catch (e) {
      if (e instanceof ValidationError) {
        return [e.toTextContent()];
      }
      throw e;
    }

    const params: Record<string, any> = {};
    let linkId: string | undefined;

    // If ID is provided, fetch single link
    if (arguments_.id) {
      linkId = arguments_.id;
      if (typeof linkId !== 'string' || !linkId.trim()) {
        const error = new ValidationError(
          'id must be a non-empty string',
          'id',
          { provided_value: linkId }
        );
        return [error.toTextContent()];
      }
    }

    // Build query parameters for list request
    if (arguments_.from_time_created) {
      try {
        validateDateFormat(arguments_.from_time_created, 'from_time_created');
        params.from_time_created = arguments_.from_time_created;
      } catch (e) {
        if (e instanceof ValidationError) {
          return [e.toTextContent()];
        }
        throw e;
      }
    }

    if (arguments_.to_time_created) {
      try {
        validateDateFormat(arguments_.to_time_created, 'to_time_created');
        params.to_time_created = arguments_.to_time_created;
      } catch (e) {
        if (e instanceof ValidationError) {
          return [e.toTextContent()];
        }
        throw e;
      }
    }

    if (arguments_.status) {
      try {
        validateEnumValue(arguments_.status, LINK_STATUSES, 'status');
        params.status = arguments_.status;
      } catch (e) {
        if (e instanceof ValidationError) {
          return [e.toTextContent()];
        }
        throw e;
      }
    }

    if (arguments_.usage_mode) {
      try {
        validateEnumValue(arguments_.usage_mode, USAGE_MODES, 'usage_mode');
        params.usage_mode = arguments_.usage_mode;
      } catch (e) {
        if (e instanceof ValidationError) {
          return [e.toTextContent()];
        }
        throw e;
      }
    }

    if (arguments_.name) {
      params.name = arguments_.name;
    }

    if (arguments_.description) {
      params.description = arguments_.description;
    }

    if (arguments_.reference) {
      params.reference = arguments_.reference;
    }

    if (arguments_.country) {
      try {
        validateCountryCode(arguments_.country, 'country');
        params.country = arguments_.country;
      } catch (e) {
        if (e instanceof ValidationError) {
          return [e.toTextContent()];
        }
        throw e;
      }
    }

    if (arguments_.amount) {
      try {
        validateAmount(arguments_.amount, 'amount');
        params.amount = arguments_.amount;
      } catch (e) {
        if (e instanceof ValidationError) {
          return [e.toTextContent()];
        }
        throw e;
      }
    }

    if (arguments_.currency) {
      try {
        validateCurrencyCode(arguments_.currency, 'currency');
        params.currency = arguments_.currency;
      } catch (e) {
        if (e instanceof ValidationError) {
          return [e.toTextContent()];
        }
        throw e;
      }
    }

    if (arguments_.shippable) {
      try {
        validateEnumValue(arguments_.shippable, SHIPPABLE_VALUES, 'shippable');
        params.shippable = arguments_.shippable;
      } catch (e) {
        if (e instanceof ValidationError) {
          return [e.toTextContent()];
        }
        throw e;
      }
    }

    if (arguments_.expiration_date) {
      params.expiration_date = arguments_.expiration_date;
    }

    if (arguments_.page !== undefined && arguments_.page !== null) {
      try {
        params.page = validatePageNumber(arguments_.page, 'page');
      } catch (e) {
        if (e instanceof ValidationError) {
          return [e.toTextContent()];
        }
        throw e;
      }
    }

    if (arguments_.page_size !== undefined && arguments_.page_size !== null) {
      try {
        params.page_size = validatePageSize(arguments_.page_size, 'page_size');
      } catch (e) {
        if (e instanceof ValidationError) {
          return [e.toTextContent()];
        }
        throw e;
      }
    }

    if (arguments_.order_by) {
      params.order_by = arguments_.order_by;
    }

    if (arguments_.order) {
      try {
        validateEnumValue(arguments_.order, ORDER_VALUES, 'order');
        params.order = arguments_.order;
      } catch (e) {
        if (e instanceof ValidationError) {
          return [e.toTextContent()];
        }
        throw e;
      }
    }

    // Validate no card numbers in query parameters
    try {
      validateNoCardNumbers(params, CONTEXT_API_REQUEST_PARAMS);
    } catch (e) {
      if (e instanceof CardNumberDetectedError) {
        const error = new ValidationError(
          ERROR_MSG_SECURITY_VIOLATION_PARAMS,
          undefined,
          { security_violation: true }
        );
        logError(error, CONTEXT_GET_LINKS_VALIDATION, false);
        return [error.toTextContent()];
      }
      throw e;
    }

    // Make API request
    let result: Record<string, any>;
    let responseData: Record<string, any>;

    if (linkId) {
      // Get single link
      result = await apiClient.get(`${ENDPOINT_LINKS}/${linkId}`);
      
      responseData = {
        success: true,
        link: result,
        merchant_id: result.merchant_id,
        account_id: result.account_id,
        message: `Retrieved link with ID: ${linkId}`,
      };
    } else {
      // Get list of links
      result = await apiClient.get(ENDPOINT_LINKS, params);
      
      responseData = {
        success: true,
        total_record_count: result.total_record_count,
        current_page_size: result.current_page_size,
        links: result.links || [],
      };

      // Add optional fields if present in response (matches Python)
      if (result.paging) {
        responseData.paging = result.paging;
      }

      if (result.filter) {
        responseData.filter = result.filter;
      }

      if (result.merchant_id) {
        responseData.merchant_id = result.merchant_id;
      }

      if (result.account_id) {
        responseData.account_id = result.account_id;
      }

      // Build message with link count and total (matches Python)
      const linkCount = (result.links || []).length;
      const messageParts = [`Retrieved ${linkCount} payment link(s)`];
      if (result.total_record_count) {
        messageParts.push(`Total records: ${result.total_record_count}`);
      }
      responseData.message = messageParts.join('. ');
    }

    return [createSuccessResponse(responseData)];

  } catch (e) {
    const error = e as Error;
    
    if (error instanceof ValidationError) {
      logError(error, CONTEXT_GET_LINKS_VALIDATION, false);
      return [error.toTextContent()];
    }

    if (error instanceof APIError) {
      logError(error, CONTEXT_GET_LINKS, false);
      return [error.toTextContent()];
    }

    logError(error, CONTEXT_GET_LINKS, true);
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      `Failed to retrieve payment links: ${error.message}`,
      { error_type: error.constructor.name }
    );
    return [errorResponse];
  }
}
