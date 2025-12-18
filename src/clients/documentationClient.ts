/**
 * Documentation client for fetching Global Payments OpenAPI specifications.
 */

import axios, { AxiosError } from 'axios';
import * as yaml from 'yaml';
import { ErrorCode, MCPError, logError } from '../utils/errors.js';

const MCP_PROTOCOL_VERSION = '2025-06-18';

/**
 * Custom exception for documentation retrieval and parsing errors.
 * 
 * Used when fetching OpenAPI specifications fails due to network issues,
 * HTTP errors, or YAML parsing problems.
 */
export class DocumentationError extends MCPError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.DOC_FETCH_FAILED,
    details: Record<string, any> = {},
    originalError?: Error
  ) {
    super(code, message, details, originalError);
    this.name = 'DocumentationError';
  }
}

/**
 * Client for retrieving and parsing Global Payments API documentation.
 * 
 * Fetches OpenAPI specifications from remote URLs and parses them into
 * structured data for consumption by AI agents.
 */
export class DocumentationClient {
  /**
   * Fetch and parse OpenAPI documentation from a URL.
   * 
   * Downloads YAML specification files from the Global Payments developer
   * portal and parses them into structured dictionaries.
   * 
   * @param url - Full URL to the OpenAPI YAML specification file.
   * @returns Parsed OpenAPI specification as an object.
   * @throws {DocumentationError} If fetching or parsing fails.
   */
  async fetchDocumentation(url: string): Promise<Record<string, any>> {
    try {
      const headers = {
        'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
      };

      const response = await axios.get(url, {
        headers,
        timeout: 30000,
      });

      const spec = yaml.parse(response.data);
      return spec;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.response) {
          const docError = new DocumentationError(
            `Failed to fetch documentation: HTTP ${axiosError.response.status}`,
            ErrorCode.DOC_FETCH_FAILED,
            {
              status_code: axiosError.response.status,
              url,
            },
            error
          );
          logError(docError, 'Documentation fetch', false);
          throw docError;
        } else if (axiosError.code === 'ECONNABORTED') {
          const timeoutError = new DocumentationError(
            'Documentation fetch timed out after 30 seconds',
            ErrorCode.DOC_NETWORK_ERROR,
            { url },
            error
          );
          logError(timeoutError, 'Documentation timeout', false);
          throw timeoutError;
        } else {
          const networkError = new DocumentationError(
            'Network error while fetching documentation',
            ErrorCode.DOC_NETWORK_ERROR,
            { url, error: error.message },
            error
          );
          logError(networkError, 'Documentation network', false);
          throw networkError;
        }
      } else if (error instanceof Error && error.message.includes('YAML')) {
        const yamlError = new DocumentationError(
          'Failed to parse YAML documentation',
          ErrorCode.DOC_PARSE_ERROR,
          { url },
          error
        );
        logError(yamlError, 'YAML parsing', false);
        throw yamlError;
      } else {
        const httpError = new DocumentationError(
          'HTTP error while fetching documentation',
          ErrorCode.DOC_FETCH_FAILED,
          { url, error: String(error) },
          error as Error
        );
        logError(httpError, 'Documentation HTTP', true);
        throw httpError;
      }
    }
  }
}
