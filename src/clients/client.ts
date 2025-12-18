/**
 * Client for Global Payments API.
 */

import axios, { AxiosError } from 'axios';
import { getSettings } from '../config/settings.js';
import { 
  APIError, 
  AuthenticationError, 
  ErrorCode, 
  NetworkError, 
  logError 
} from '../utils/errors.js';
import { 
  generateIdentifier, 
  generateNonce, 
  generateSecretHash, 
  logApiCall 
} from '../utils/index.js';
import {
  BASE_URL_SANDBOX,
  ENDPOINT_ACCESS_TOKEN, 
  ENDPOINT_LINKS 
} from '../utils/constants.js';
// Ensure the correct path and file extension for AuthenticationManager import
import type { AuthenticationManager } from '../api/auth.js';

export interface CreatePaymentLinkOptions {
  amount: string;
  currency: string;
  country: string;
  name?: string;
  description?: string;
  reference?: string;
  usageMode?: string;
  usageLimit?: number;
  expirationDate?: string;
  shippable?: string;
  shippingAmount?: string;
}

export class GPAPIClient {
  private authManager: AuthenticationManager | null;
  private baseUrl: string;
  private apiVersion: string;
  private accountId?: string;
  private accountName?: string;

  constructor(authManager?: AuthenticationManager) {
    this.authManager = authManager || null;
    const settings = getSettings();
    this.baseUrl = settings.gpapi_base_url;
    this.apiVersion = settings.api_version;
    this.accountId = settings.gpapi_account_id;
    this.accountName = settings.gpapi_account_name;
  }

  async requestAccessToken(): Promise<Record<string, any>> {
    const settings = getSettings();
    
    const nonce = generateNonce();
    const secretHash = generateSecretHash(nonce, settings.gpapi_app_secret);
    
    const requestData = {
      app_id: settings.gpapi_app_id,
      secret: secretHash,
      grant_type: 'client_credentials',
      nonce: nonce,
      interval_to_expire: settings.token_expiry_interval,
      permissions: settings.token_permissions,
    };

    try {
      const headers = {
        'X-GP-Version': this.apiVersion,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      const response = await axios.post(
        `${this.baseUrl}${ENDPOINT_ACCESS_TOKEN}`,
        requestData,
        {
          headers,
          timeout: 30000,
        }
      );
      
      logApiCall(
        'POST', 
        `${this.baseUrl}${ENDPOINT_ACCESS_TOKEN}`, 
        headers, 
        requestData, 
        response.status, 
        response.data
      );
      
      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response) {
          const statusCode = axiosError.response.status;
          const responseText = typeof axiosError.response.data === 'string' 
            ? axiosError.response.data 
            : JSON.stringify(axiosError.response.data);

          let authError: AuthenticationError;
          if (statusCode === 401 || statusCode === 403) {
            authError = new AuthenticationError(
              'Failed to obtain access token: Invalid credentials',
              ErrorCode.CREDENTIALS_INVALID,
              {
                status_code: statusCode,
                response: responseText.slice(0, 200),
              },
              error
            );
          } else {
            authError = new AuthenticationError(
              `Failed to obtain access token: HTTP ${statusCode}`,
              ErrorCode.AUTH_FAILED,
              {
                status_code: statusCode,
                response: responseText.slice(0, 200),
              },
              error
            );
          }

          logError(authError, 'Token acquisition', false);
          throw authError;
        } else if (axiosError.code === 'ECONNABORTED') {
          const timeoutError = new AuthenticationError(
            'Token request timed out after 30 seconds',
            ErrorCode.AUTH_FAILED,
            { timeout: '30s' },
            error
          );
          logError(timeoutError, 'Token request timeout', false);
          throw timeoutError;
        } else {
          const networkError = new AuthenticationError(
            'Network error while requesting access token',
            ErrorCode.AUTH_FAILED,
            { error: error.message },
            error
          );
          logError(networkError, 'Token request network', false);
          throw networkError;
        }
      } else {
        const httpError = new AuthenticationError(
          'HTTP error while requesting access token',
          ErrorCode.AUTH_FAILED,
          { error: String(error) },
          error as Error
        );
        logError(httpError, 'Token request', true);
        throw httpError;
      }
    }
  }

  async createPaymentLink(options: {
    amount: string;
    currency: string;
    country: string;
    name?: string;
    description?: string;
    reference?: string;
    usageMode?: string;
    usageLimit?: number;
    expirationDate?: string;
    shippable?: string;
    shippingAmount?: string;
  }): Promise<Record<string, any>> {
    const {
      amount,
      currency,
      country,
      name,
      description,
      reference,
      usageMode = 'SINGLE',
      usageLimit,
      expirationDate,
      shippable = 'NO',
      shippingAmount,
    } = options;

    const requestData: Record<string, any> = {
      type: 'PAYMENT',
      usage_mode: usageMode,
      name: name || generateIdentifier('mcp', 6, 12),
      description: description || generateIdentifier('mcp', 6, 12),
      reference: reference || generateIdentifier('mcp', 8, 12),
      shippable: shippable,
      transactions: {
        allowed_payment_methods: ['CARD'],
        amount: amount,
        channel: 'CNP',
        currency: currency,
        country: country,
      },
    };

    // Add shipping_amount if shippable is YES (matches Python)
    if (shippable === 'YES' && shippingAmount !== undefined) {
      requestData.shipping_amount = shippingAmount;
    }

    // Get account identifier (may throw if not available)
    const [accountId, accountName] = await this.getAccountIdentifier();
    
    if (accountId) {
      requestData.account_id = accountId;
    } else if (accountName) {
      requestData.account_name = accountName;
    }

    if (usageMode === 'MULTIPLE' && usageLimit !== undefined) {
      requestData.usage_limit = usageLimit;
    }

    if (expirationDate) {
      requestData.expiration_date = expirationDate;
    }

    if (!this.authManager) {
      throw new APIError('Authentication manager is required for authenticated API calls');
    }

    const token = await this.authManager.getToken();

    try {
      const settings = getSettings();
      const baseUrl = settings.env === 'SANDBOX' ? BASE_URL_SANDBOX : this.baseUrl;
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-GP-Version': this.apiVersion,
        'Content-Type': 'application/json',
      };

      const response = await axios.post(
        `${baseUrl}${ENDPOINT_LINKS}`,
        requestData,
        {
          headers,
          timeout: 30000,
        }
      );
      
      logApiCall(
        'POST', 
        `${baseUrl}${ENDPOINT_LINKS}`, 
        headers, 
        requestData, 
        response.status, 
        response.data
      );
      
      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response) {
          const statusCode = axiosError.response.status;
          const responseText = typeof axiosError.response.data === 'string' 
            ? axiosError.response.data 
            : JSON.stringify(axiosError.response.data);

          let message: string;

          if (statusCode === 429) {
            message = 'API rate limit exceeded. Please try again later.';
          } else if (statusCode >= 500) {
            message = 'Global Payments API is currently unavailable. Please try again later.';
          } else if (statusCode === 401) {
            message = 'Authentication failed. Token may be invalid or expired.';
          } else {
            message = `API request failed with status ${statusCode}`;
          }

          const apiError = new APIError(
            message,
            statusCode,
            responseText.slice(0, 500),
            {},
            error
          );
          logError(apiError, 'API request', false);
          throw apiError;
        } else if (axiosError.code === 'ECONNABORTED') {
          const timeoutError = new NetworkError(
            'Request to Global Payments API timed out after 30 seconds',
            ErrorCode.TIMEOUT_ERROR,
            {},
            error
          );
          logError(timeoutError, 'API request timeout', false);
          throw timeoutError;
        } else {
          const networkError = new NetworkError(
            'Network error while connecting to Global Payments API',
            ErrorCode.CONNECTION_ERROR,
            { error: error.message },
            error
          );
          logError(networkError, 'API network connection', false);
          throw networkError;
        }
      } else {
        const httpError = new NetworkError(
          'HTTP error while communicating with Global Payments API',
          ErrorCode.NETWORK_ERROR,
          { error: String(error) },
          error as Error
        );
        logError(httpError, 'API HTTP error', true);
        throw httpError;
      }
    }
  }

  /**
   * Send a POST request to the Global Payments API.
   * 
   * @param endpoint - API endpoint path (e.g., "/ucp/mcp/links").
   * @param data - Request payload as object.
   * @returns Response data from the API.
   */
  async post(endpoint: string, data: Record<string, any>): Promise<Record<string, any>> {
    if (!this.authManager) {
      throw new APIError('Authentication manager is required for authenticated API calls');
    }

    const token = await this.authManager.getToken();

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-GP-Version': this.apiVersion,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      const response = await axios.post(
        `${this.baseUrl}${endpoint}`,
        data,
        {
          headers,
          timeout: 30000,
        }
      );
      
      logApiCall(
        'POST', 
        `${this.baseUrl}${endpoint}`, 
        headers, 
        data, 
        response.status, 
        response.data
      );
      
      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response) {
          const statusCode = axiosError.response.status;
          const responseText = typeof axiosError.response.data === 'string' 
            ? axiosError.response.data 
            : JSON.stringify(axiosError.response.data);

          // Extract detailed_error_message from response (matches Python)
          let detailedErrorMessage: string | undefined;
          let responseBody: any;
          try {
            if (typeof axiosError.response.data === 'object' && axiosError.response.data !== null) {
              const errorData = axiosError.response.data as Record<string, any>;
              detailedErrorMessage = errorData.detailed_error_message;
              responseBody = errorData;
            } else if (typeof axiosError.response.data === 'string') {
              const errorData = JSON.parse(axiosError.response.data);
              if (errorData && typeof errorData === 'object') {
                detailedErrorMessage = errorData.detailed_error_message;
                responseBody = errorData;
              }
            }
          } catch {
            responseBody = responseText.slice(0, 500);
          }

          let message: string;

          if (statusCode === 429) {
            message = 'API rate limit exceeded. Please try again later.';
          } else if (statusCode >= 500) {
            message = 'Global Payments API is currently unavailable. Please try again later.';
          } else if (statusCode === 401) {
            message = 'Authentication failed. Token may be invalid or expired.';
          } else {
            // Use detailed_error_message from API if available (matches Python)
            if (detailedErrorMessage) {
              message = detailedErrorMessage;
            } else {
              message = `API request failed with status ${statusCode}`;
            }
          }

          const apiError = new APIError(
            message,
            statusCode,
            responseBody ? JSON.stringify(responseBody).slice(0, 500) : undefined,
            responseBody ? { response: responseBody } : {},
            error
          );
          logError(apiError, 'API request', false);
          throw apiError;
        } else if (axiosError.code === 'ECONNABORTED') {
          const timeoutError = new NetworkError(
            'Request to Global Payments API timed out after 30 seconds',
            ErrorCode.TIMEOUT_ERROR,
            {},
            error
          );
          logError(timeoutError, 'API request timeout', false);
          throw timeoutError;
        } else {
          const networkError = new NetworkError(
            'Network error while connecting to Global Payments API',
            ErrorCode.CONNECTION_ERROR,
            { error: error.message },
            error
          );
          logError(networkError, 'API network connection', false);
          throw networkError;
        }
      } else {
        const httpError = new NetworkError(
          'HTTP error while communicating with Global Payments API',
          ErrorCode.NETWORK_ERROR,
          { error: String(error) },
          error as Error
        );
        logError(httpError, 'API HTTP error', true);
        throw httpError;
      }
    }
  }

  /**
   * Send a GET request to the Global Payments API.
   * 
   * @param endpoint - API endpoint path (e.g., "/ucp/mcp/links").
   * @param params - Query parameters as object.
   * @returns Response data from the API.
   */
  async get(endpoint: string, params?: Record<string, any>): Promise<Record<string, any>> {
    if (!this.authManager) {
      throw new APIError('Authentication manager is required for authenticated API calls');
    }

    const token = await this.authManager.getToken();

    try {
      const settings = getSettings();
      const baseUrl = settings.env === 'SANDBOX' ? BASE_URL_SANDBOX : this.baseUrl;
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-GP-Version': this.apiVersion,
        'Accept': 'application/json',
      };
      
      const response = await axios.get(
        `${baseUrl}${endpoint}`,
        {
          headers,
          params,
          timeout: 30000,
        }
      );
      
      logApiCall(
        'GET', 
        `${baseUrl}${endpoint}`, 
        headers, 
        params, 
        response.status, 
        response.data
      );
      
      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.response) {
          const statusCode = axiosError.response.status;
          const responseText = typeof axiosError.response.data === 'string' 
            ? axiosError.response.data 
            : JSON.stringify(axiosError.response.data);

          // Extract detailed_error_message from response (matches Python)
          let detailedErrorMessage: string | undefined;
          let responseBody: any;
          try {
            if (typeof axiosError.response.data === 'object' && axiosError.response.data !== null) {
              const errorData = axiosError.response.data as Record<string, any>;
              detailedErrorMessage = errorData.detailed_error_message;
              responseBody = errorData;
            } else if (typeof axiosError.response.data === 'string') {
              const errorData = JSON.parse(axiosError.response.data);
              if (errorData && typeof errorData === 'object') {
                detailedErrorMessage = errorData.detailed_error_message;
                responseBody = errorData;
              }
            }
          } catch {
            responseBody = responseText.slice(0, 500);
          }

          let message: string;

          if (statusCode === 429) {
            message = 'API rate limit exceeded. Please try again later.';
          } else if (statusCode >= 500) {
            message = 'Global Payments API is currently unavailable. Please try again later.';
          } else if (statusCode === 401) {
            message = 'Authentication failed. Token may be invalid or expired.';
          } else if (statusCode === 404) {
            // Use detailed_error_message from API if available (matches Python)
            if (detailedErrorMessage) {
              message = detailedErrorMessage;
            } else {
              message = 'Resource not found';
            }
          } else {
            // Use detailed_error_message from API if available (matches Python)
            if (detailedErrorMessage) {
              message = detailedErrorMessage;
            } else {
              message = `API request failed with status ${statusCode}`;
            }
          }

          const apiError = new APIError(
            message,
            statusCode,
            responseBody ? JSON.stringify(responseBody).slice(0, 500) : undefined,
            responseBody ? { response: responseBody } : {},
            error
          );
          logError(apiError, 'API request', false);
          throw apiError;
        } else if (axiosError.code === 'ECONNABORTED') {
          const timeoutError = new NetworkError(
            'Request to Global Payments API timed out after 30 seconds',
            ErrorCode.TIMEOUT_ERROR,
            {},
            error
          );
          logError(timeoutError, 'API request timeout', false);
          throw timeoutError;
        } else {
          const networkError = new NetworkError(
            'Network error while connecting to Global Payments API',
            ErrorCode.CONNECTION_ERROR,
            { error: error.message },
            error
          );
          logError(networkError, 'API network connection', false);
          throw networkError;
        }
      } else {
        const httpError = new NetworkError(
          'HTTP error while communicating with Global Payments API',
          ErrorCode.NETWORK_ERROR,
          { error: String(error) },
          error as Error
        );
        logError(httpError, 'API HTTP error', true);
        throw httpError;
      }
    }
  }

  /**
   * Get account identifier (account_id or account_name) for API requests.
   * 
   * Priority order:
   * 1. Configured account_id (from environment)
   * 2. Configured account_name (from environment)
   * 3. Account name auto-detected from access token
   * 
   * If none available, throws AuthenticationError with helpful message.
   * 
   * @returns Tuple of [account_id, account_name].
   * @throws AuthenticationError if no account identifier is available.
   */
  async getAccountIdentifier(): Promise<[string | undefined, string | undefined]> {
    // Priority 1: Use configured account ID
    if (this.accountId) {
      return [this.accountId, undefined];
    }

    // Priority 2: Use configured account name
    if (this.accountName) {
      return [undefined, this.accountName];
    }

    // Priority 3: Try to get account name from token cache
    if (this.authManager) {
      // Ensure token is fetched/refreshed
      await this.authManager.getToken();
      
      const cachedAccountName = this.authManager.getCachedAccountName();
      if (cachedAccountName) {
        return [undefined, cachedAccountName];
      }
    }

    // No account identifier available - throw error
    const settings = getSettings();
    const requiredPermissions = settings.token_permissions.join(', ');
    
    throw new AuthenticationError(
      `Insufficient permissions: Make sure you have a transaction account with the following permissions: ${requiredPermissions}`,
      ErrorCode.CREDENTIALS_INVALID
    );
  }
}
