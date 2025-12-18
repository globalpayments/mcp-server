/**
 * Configuration management for the MCP Server.
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import {
  BASE_URL_CERT,
  BASE_URL_PROD,
  API_VERSION,
  DEFAULT_TOKEN_EXPIRY_INTERVAL,
  DEFAULT_TOKEN_PERMISSIONS,
  DEFAULT_TOKEN_REFRESH_BUFFER,
  DEFAULT_HTTP_TIMEOUT,
  DEFAULT_LOG_LEVEL,
} from '../utils/constants.js';

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const SettingsSchema = z.object({
  gpapi_app: z.string(),
  env: z.enum(["SANDBOX", "PROD"]).default("SANDBOX"),
  gpapi_account_name: z.string().optional(),
  gpapi_account_id: z.string().optional(),
  
  gpapi_app_id: z.string().default(""),
  gpapi_app_secret: z.string().default(""),
  gpapi_base_url: z.string().default(""),
  api_version: z.string().default(API_VERSION),
  
  token_expiry_interval: z.string().default(DEFAULT_TOKEN_EXPIRY_INTERVAL),
  token_permissions: z.array(z.string()).default(DEFAULT_TOKEN_PERMISSIONS),
  token_refresh_buffer_seconds: z.number().default(DEFAULT_TOKEN_REFRESH_BUFFER),
  
  http_timeout: z.number().default(DEFAULT_HTTP_TIMEOUT),
  
  log_level: z.string().default(DEFAULT_LOG_LEVEL),
  debug_api_calls: z.boolean().default(false),
}).transform((data) => {
  // Parse GPAPI_APP
  if (!data.gpapi_app.includes(':')) {
    throw new Error("GPAPI_APP must be in format 'APP_ID:APP_SECRET'");
  }
  
  const [appId, appSecret] = data.gpapi_app.split(':', 2);
  if (!appId?.trim() || !appSecret?.trim()) {
    throw new Error("Both APP_ID and APP_SECRET must be non-empty in GPAPI_APP");
  }
  
  data.gpapi_app_id = appId.trim();
  data.gpapi_app_secret = appSecret.trim();
  
  // Set base URL based on environment
  if (data.env === "PROD") {
    data.gpapi_base_url = BASE_URL_PROD;
  } else {
    data.gpapi_base_url = BASE_URL_CERT;
  }
  
  // Note: Account ID and Account Name are now optional.
  // If not provided, the account will be auto-detected from the access token.
  // The token must have proper permissions for this to work.
  
  return data;
});

export type Settings = z.infer<typeof SettingsSchema>;

// Parse token permissions from environment
function parseTokenPermissions(value: string | undefined): string[] {
  if (!value) {
    return DEFAULT_TOKEN_PERMISSIONS;
  }
  
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Not JSON, try comma-separated
  }
  
  return value.split(',').map(p => p.trim()).filter(p => p.length > 0);
}

function createSettings(): Settings {
  const rawSettings = {
    gpapi_app: process.env.GPAPI_APP || '',
    env: (process.env.ENV?.toUpperCase() || 'SANDBOX') as 'SANDBOX' | 'PROD',
    gpapi_account_name: process.env.GPAPI_ACCOUNT_NAME,
    gpapi_account_id: process.env.GPAPI_ACCOUNT_ID,
    gpapi_app_id: '',
    gpapi_app_secret: '',
    gpapi_base_url: '',
    api_version: process.env.API_VERSION || API_VERSION,
    token_expiry_interval: process.env.TOKEN_EXPIRY_INTERVAL || DEFAULT_TOKEN_EXPIRY_INTERVAL,
    token_permissions: parseTokenPermissions(process.env.TOKEN_PERMISSIONS),
    token_refresh_buffer_seconds: parseInt(process.env.TOKEN_REFRESH_BUFFER_SECONDS || String(DEFAULT_TOKEN_REFRESH_BUFFER), 10),
    http_timeout: parseFloat(process.env.HTTP_TIMEOUT || String(DEFAULT_HTTP_TIMEOUT)),
    log_level: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
    debug_api_calls: process.env.DEBUG_API_CALLS === 'true',
  };
  
  return SettingsSchema.parse(rawSettings);
}

let _settings: Settings | null = null;

export function getSettings(): Settings {
  if (_settings === null) {
    _settings = createSettings();
  }
  return _settings;
}

export function resetSettings(): void {
  _settings = null;
}