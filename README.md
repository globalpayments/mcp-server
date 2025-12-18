# Global Payments MCP Server (TypeScript)

A Model Context Protocol (MCP) server for Global Payments API integration, enabling AI agents to create and manage payment links programmatically using TypeScript/Node.js.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Available Tools](#available-tools)

## About

This MCP server bridges AI agents (like Claude or GitHub Copilot) with the Global Payments API, allowing natural language payment link creation, retrieval, and management with automatic authentication, token management, and comprehensive error handling. Built with TypeScript for type safety and modern Node.js development.

## Features

- Payment link creation (single-use and multi-use)
- Payment link retrieval and filtering
- API documentation retrieval (19+ API categories)

## Prerequisites

- Node.js 18.0 or higher
- npm
- Global Payments API credentials ([Get them here](https://developer.globalpay.com))
- Claude Desktop, VS Code with Copilot, or another MCP-compatible client

   > **Note:** It is recommended that the app being used has limited access. specifically only the LNK related resources should be added in the App permissions

## Installation

1. **Clone the repository**
   ```sh
   git clone https://github.com/globalpayments/mcp-server.git
   cd gpapi-mcp-server/Typescript
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Build the project**
   ```sh
   npm run build
   ```

4. **Create `.env` file in the project root**
   
   Create a `.env` file in the TypeScript directory with your credentials:
   
   ```env
   # Required: Your Global Payments App credentials (format: APP_ID:APP_SECRET)
   GPAPI_APP=your_app_id:your_app_secret
   
   # Optional: Your Global Payments Account (provide ONE of these, or leave blank for auto-detection)
   # If not provided, the account will be auto-detected from the access token
   # GPAPI_ACCOUNT_ID=your_account_id
   # OR
   # GPAPI_ACCOUNT_NAME=your_account_name
   
   # Optional: Environment (SANDBOX, or PROD, default: SANDBOX)
   ENV=SANDBOX
   ```
   
   
   > **Note:** The `.env` file is the recommended way to store credentials. It keeps sensitive information out of your configuration files and makes it easier to manage different environments.
   
5. **Configure Your MCP Client**

   #### For Claude Desktop
   
   Add to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "global-payments": {
         "command": "node",
         "args": [
           "X://absolute//path//to//gpapi-mcp-server//Typescript//lib//index.js"
         ],
         "env":{
          "GPAPI_APP":"XXXXXXXXXXXXXXXXX:XXXXXXX",
          "GPAPI_ACCOUNT_NAME":"XXXXXXXXX",
          "ENV":"SANDBOX"
         }
       }
     }
   }
   ```

   #### For VS Code (Copilot)
   
   Add to your VS Code MCP settings file (`mcp.json`):
   ```json
   {
     "servers": {
       "global-payments": {
         "command": "node",
         "args": [
           "lib/index.js"
         ],
         "cwd": "./",
         "env":{
          "GPAPI_APP":"XXXXXXXXXXXXXXXXX:XXXXXXX",
          "GPAPI_ACCOUNT_NAME":"XXXXXXXXX",
          "ENV":"SANDBOX"
         }
       }
     }
   }
   ```
   
   **Note:** Ensure you provide the absolute path to your TypeScript project directory in the `cwd` field. The `.env` file should be located in this directory.


## Available Tools

This MCP server provides the following tools:

| Tool | Description |
|------|-------------|
| `create_payment_link` | Create single-use or multi-use payment links |
| `get_links` | Retrieve and filter payment links |
| `get_documentation` | Retrieve API documentation for 19+ categories |

