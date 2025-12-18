/**
 * MCP Server for Global Payments API integration.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { AuthenticationManager } from '../api/auth.js';
import { GPAPIClient } from '../clients/client.js';
import { TOOL_DEFINITION, handleCreatePaymentLink } from '../tools/createPaymentLink.js';
import { GET_DOCUMENTATION_TOOL, handleGetDocumentation } from '../tools/getDocumentation.js';
import { GET_LINKS_TOOL, handleGetLinks } from '../tools/getLinks.js';
import { DocumentationClient } from '../clients/documentationClient.js';

/**
 * MCP Server implementation for Global Payments API integration.
 * 
 * Coordinates between authentication, API clients, and tool handlers to
 * provide AI agents with Global Payments API capabilities.
 */
export class GPAPIServer {
  private server: Server;
  private unauthenticatedClient: GPAPIClient;
  private authManager: AuthenticationManager;
  private apiClient: GPAPIClient;
  private docClient: DocumentationClient;

  constructor() {
    this.server = new Server(
      {
        name: 'global-payments',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.unauthenticatedClient = new GPAPIClient();
    this.authManager = new AuthenticationManager(this.unauthenticatedClient);
    this.apiClient = new GPAPIClient(this.authManager);
    this.docClient = new DocumentationClient();
    
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, () => {
      return {
        tools: [TOOL_DEFINITION, GET_DOCUMENTATION_TOOL, GET_LINKS_TOOL],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === 'create_payment_link') {
        const result = await handleCreatePaymentLink(request.params.arguments || {}, this.apiClient);
        return {
          content: result,
        };
      }
      if (request.params.name === 'get_documentation') {
        const result = await handleGetDocumentation(request.params.arguments || {}, this.docClient);
        return {
          content: result,
        };
      }
      if (request.params.name === 'get_links') {
        const result = await handleGetLinks(request.params.arguments || {}, this.apiClient);
        return {
          content: result,
        };
      }
      throw new Error(`Unknown tool: ${request.params.name}`);
    });
  }

  async run(): Promise<void> {
    this.authManager.invalidate();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Global Payments MCP server running on stdio');
  }

  cleanup(): void {
    this.authManager.invalidate();
  }
}