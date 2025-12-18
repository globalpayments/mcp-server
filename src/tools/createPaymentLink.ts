/**
 * Payment link creation tool for GPAPI MCP Server.
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
} from '../utils/index.js';
import {
  validateAmount,
  validateEnumValue,
} from '../utils/validators.js';
import {
  SHIPPABLE_VALUES,
  MIN_SHIPPING_AMOUNT,
  ERROR_MSG_SHIPPING_AMOUNT_MANDATORY,
  CONTEXT_PAYMENT_LINK_CREATION,
  CONTEXT_PAYMENT_LINK_VALIDATION,
  AMOUNT_DISPLAY_DIVISOR,
  AMOUNT_DECIMAL_PLACES,
  SUCCESS_MSG_PAYMENT_LINK_CREATED,
} from '../utils/constants.js';

export const TOOL_DEFINITION: Tool = {
  name: 'create_payment_link',
  description: 'Create a payment link using Global Payments API. Returns a unique URL that can be shared with customers for payment collection. Supports single-use or multi-use links with customizable amounts, currencies, and countries.',
  inputSchema: {
    type: 'object',
    properties: {
      amount: {
        type: 'string',
        description: 'Payment amount in the smallest currency unit (e.g., cents for USD, pence for GBP). Example: "4999" for $49.99. IMPORTANT: This should be ONLY the item/product cost. DO NOT include shipping - use shipping_amount parameter separately.',
      },
      currency: {
        type: 'string',
        description: 'Three-letter ISO 4217 currency code (e.g., "USD", "GBP", "EUR")',
        pattern: '^[A-Z]{3}$',
      },
      country: {
        type: 'string',
        description: 'Two-letter ISO 3166-1 country code (e.g., "US", "GB", "CA")',
        pattern: '^[A-Z]{2}$',
      },
      name: {
        type: 'string',
        description: 'Display name for the payment link (1-120 characters). If not provided, auto-generated.',
        minLength: 1,
        maxLength: 120,
      },
      description: {
        type: 'string',
        description: 'Description of what the payment is for (1-250 characters). If not provided, auto-generated.',
        minLength: 1,
        maxLength: 250,
      },
      reference: {
        type: 'string',
        description: 'Your internal reference ID for this link (8-50 characters). If not provided, auto-generated.',
        minLength: 8,
        maxLength: 50,
      },
      usage_mode: {
        type: 'string',
        enum: ['SINGLE', 'MULTIPLE'],
        description: 'Whether the link can be used once (SINGLE) or multiple times (MULTIPLE). Default: SINGLE',
      },
      usage_limit: {
        type: 'integer',
        description: 'Maximum number of times the link can be used. Required if usage_mode is MULTIPLE. Default: 50',
        minimum: 1,
        maximum: 1000,
      },
      expiration_date: {
        type: 'string',
        format: 'date-time',
        description: 'ISO 8601 date-time when the link expires (e.g., "2026-12-20T00:35:28Z"). Optional.',
      },
      shippable: {
        type: 'string',
        enum: ['YES', 'NO'],
        description: 'Should be set to "YES" if the payment requires shipping, otherwise "NO". Default: NO',
      },
      shipping_amount: {
        type: 'string',
        description: 'If shippable is "YES", the shipping cost in smallest currency unit (e.g., "499" for $4.99). Conditionally MANDATORY when shippable is "YES".',
      },
    },
    required: ['amount', 'currency', 'country'],
  },
};

export async function handleCreatePaymentLink(
  arguments_: Record<string, any>,
  apiClient: GPAPIClient
): Promise<TextContent[]> {
  try {
    // Validate no card numbers in input arguments (matches Python)
    try {
      validateToolArgumentsNoCardNumbers(arguments_);
    } catch (e) {
      if (e instanceof ValidationError) {
        return [e.toTextContent()];
      }
      throw e;
    }

    const amount = arguments_.amount;
    const currency = arguments_.currency;
    const country = arguments_.country;
    const usageMode = arguments_.usage_mode || 'SINGLE';
    let usageLimit = arguments_.usage_limit;
    const shippable = arguments_.shippable || 'NO';
    let shippingAmount = arguments_.shipping_amount;

    // Convert integer shipping_amount to string if needed (matches Python)
    if (shippingAmount !== undefined && typeof shippingAmount === 'number') {
      shippingAmount = String(shippingAmount);
    }

    // Validate shippable and shipping_amount relationship (matches Python)
    if (shippable === 'YES' && shippingAmount === undefined) {
      const error = new ValidationError(
        ERROR_MSG_SHIPPING_AMOUNT_MANDATORY,
        'shipping_amount',
        { shippable }
      );
      return [error.toTextContent()];
    }

    // Validate shippable enum value (matches Python)
    try {
      validateEnumValue(shippable, SHIPPABLE_VALUES, 'shippable');
    } catch (e) {
      if (e instanceof ValidationError) {
        return [e.toTextContent()];
      }
      throw e;
    }

    // Validate shipping_amount if provided (matches Python)
    if (shippingAmount !== undefined) {
      try {
        validateAmount(shippingAmount, 'shipping_amount', MIN_SHIPPING_AMOUNT);
      } catch (e) {
        if (e instanceof ValidationError) {
          return [e.toTextContent()];
        }
        throw e;
      }
    }

    if (usageMode === 'MULTIPLE') {
      if (usageLimit === undefined) {
        usageLimit = 50;
      }

      if (usageLimit < 1 || usageLimit > 1000) {
        const error = new ValidationError(
          'usage_limit must be between 1 and 1000',
          'usage_limit',
          { provided_value: usageLimit }
        );
        return [error.toTextContent()];
      }
    }

    // Remove auto-generated expiration date - let API handle defaults (matches Python)
    const expirationDate = arguments_.expiration_date;

    const result = await apiClient.createPaymentLink({
      amount,
      currency,
      country,
      name: arguments_.name,
      description: arguments_.description,
      reference: arguments_.reference,
      usageMode,
      usageLimit,
      expirationDate,
      shippable,
      shippingAmount,
    });

    // Remove hardcoded $ symbol - use currency-neutral formatting (matches Python)
    const amountDisplay = parseFloat(amount) / AMOUNT_DISPLAY_DIVISOR;
    const responseData = {
      success: true,
      payment_link: {
        id: result.id,
        url: result.url,
        amount: `${amountDisplay.toFixed(AMOUNT_DECIMAL_PLACES)} ${currency}`,
        status: result.status,
        usage_mode: result.usage_mode,
        reference: result.reference,
        expiration_date: result.expiration_date,
      },
      message: SUCCESS_MSG_PAYMENT_LINK_CREATED,
    };

    return [createSuccessResponse(responseData)];

  } catch (error) {
    if (error instanceof ValidationError) {
      logError(error, CONTEXT_PAYMENT_LINK_VALIDATION, false);
      return [error.toTextContent()];
    }

    if (error instanceof APIError) {
      logError(error, CONTEXT_PAYMENT_LINK_CREATION, false);
      return [error.toTextContent()];
    }

    logError(error as Error, CONTEXT_PAYMENT_LINK_CREATION, true);
    const errorResponse = createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      `Failed to create payment link: ${(error as Error).message}`,
      { error_type: (error as Error).constructor.name }
    );
    return [errorResponse];
  }
}