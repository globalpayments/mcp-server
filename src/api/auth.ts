/**
 * Authentication manager for GPAPI token + caching.
 */

import { getSettings } from '../config/settings.js';
import { AccessTokenResponseSchema, TokenCache } from '../models/index.js';
import { AuthenticationError, ErrorCode } from '../utils/errors.js';
import {
  DEFAULT_TOKEN_EXPIRY_SECONDS,
  TOKEN_INTERVAL_SUFFIX,
  TOKEN_INTERVAL_MULTIPLIER,
  FIELD_ACCOUNTS,
  FIELD_NAME,
  ERROR_MSG_API_CLIENT_NOT_CONFIGURED,
} from '../utils/constants.js';
import type { GPAPIClient } from '../clients/client.js';

export class AuthenticationManager {
  private cache: TokenCache | null = null;
  private client: GPAPIClient | null = null;
  private lock = false;

  constructor(client?: GPAPIClient) {
    this.client = client || null;
  }

  setClient(client: GPAPIClient): void {
    this.client = client;
  }

  async getToken(): Promise<string> {
    // Simple lock mechanism to prevent concurrent token refreshes
    while (this.lock) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (this.isTokenValid()) {
      return this.cache?.token ?? '';
    }

    return await this.refreshToken();
  }

  private isTokenValid(): boolean {
    if (!this.cache) {
      return false;
    }
    const settings = getSettings();
    const expiryWithBuffer = new Date(
      this.cache.expiresAt.getTime() - (settings.token_refresh_buffer_seconds * 1000)
    );
    return new Date() < expiryWithBuffer;
  }

  private async refreshToken(): Promise<string> {
    this.lock = true;
    
    try {
      if (!this.client) {
        throw new AuthenticationError(
          ERROR_MSG_API_CLIENT_NOT_CONFIGURED,
          ErrorCode.CONFIGURATION_ERROR
        );
      }

      const rawResponse = await this.client.requestAccessToken();
      const tokenData = AccessTokenResponseSchema.parse(rawResponse);

      let secondsToExpire = tokenData.seconds_to_expire;
      if (secondsToExpire === undefined) {
        if (tokenData.interval_to_expire) {
          const interval = tokenData.interval_to_expire.toLowerCase();
          secondsToExpire = parseInt(interval.replace(TOKEN_INTERVAL_SUFFIX, ''), 10) * TOKEN_INTERVAL_MULTIPLIER;
        } else {
          secondsToExpire = DEFAULT_TOKEN_EXPIRY_SECONDS;
        }
      }

      // Extract account name from token scope
      let accountNameFromToken: string | undefined;
      if (tokenData.scope && typeof tokenData.scope === 'object' && !Array.isArray(tokenData.scope)) {
        const accounts = (tokenData.scope)[FIELD_ACCOUNTS];
        if (Array.isArray(accounts) && accounts.length > 0) {
          const firstAccount = accounts[0];
          if (typeof firstAccount === 'object' && firstAccount !== null) {
            accountNameFromToken = firstAccount[FIELD_NAME];
          }
        }
      }

      this.cache = {
        token: tokenData.token,
        expiresAt: new Date(Date.now() + secondsToExpire * 1000),
        createdAt: new Date(),
        accountName: accountNameFromToken,
      };

      return this.cache.token;
    } finally {
      this.lock = false;
    }
  }

  getCachedAccountName(): string | undefined {
    return this.cache?.accountName;
  }

  invalidate(): void {
    this.cache = null;
  }
}