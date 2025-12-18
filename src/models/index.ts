/**
 * Data models for the MCP Server.
 */

import { z } from 'zod';

/**
 * In-memory cache for OAuth access tokens.
 * 
 * Stores the token string along with expiration information
 * and account name for automatic refresh logic.
 */
export const TokenCacheSchema = z.object({
  token: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  accountName: z.string().optional(),
});

export type TokenCache = z.infer<typeof TokenCacheSchema>;

export const AccessTokenResponseSchema = z.object({
  token: z.string(),
  type: z.string().default('Bearer'),
  seconds_to_expire: z.number().optional(),
  scope: z.union([z.string(), z.array(z.string()), z.record(z.any()), z.null()]).optional(),
  app_id: z.string().optional(),
  app_name: z.string().optional(),
  time_created: z.string().optional(),
  interval_to_expire: z.string().optional(),
  email: z.string().optional(),
});

export type AccessTokenResponse = z.infer<typeof AccessTokenResponseSchema>;

export const PaymentLinkRequestSchema = z.object({
  type: z.string(),
  merchant_id: z.string(),
  account_id: z.string(),
  usage_mode: z.string(),
  name: z.string(),
  description: z.string(),
  reference: z.string(),
  shippable: z.string(),
  usage_limit: z.number().optional(),
  expiration_date: z.string().optional(),
  transactions: z.record(z.any()),
  notifications: z.record(z.string()).optional(),
});

export type PaymentLinkRequest = z.infer<typeof PaymentLinkRequestSchema>;

export const PaymentLinkResponseSchema = z.object({
  id: z.string(),
  url: z.string(),
  status: z.string(),
  type: z.string(),
  usage_mode: z.string(),
  reference: z.string(),
  name: z.string(),
  description: z.string(),
  account_name: z.string().optional(),
  usage_limit: z.number().optional(),
  shippable: z.string().optional(),
  shipping_amount: z.string().optional(),
  viewed_count: z.string().optional(),
  expiration_date: z.string().optional(),
  transactions: z.record(z.any()).optional(),
  action: z.record(z.any()).optional(),
});

export type PaymentLinkResponse = z.infer<typeof PaymentLinkResponseSchema>;