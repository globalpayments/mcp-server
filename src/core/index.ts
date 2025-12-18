/**
 * Entry point for the Global Payments MCP Server
 */

import { GPAPIServer } from './server.js';
import { getSettings } from '../config/settings.js';

async function main(): Promise<void> {
  const settings = getSettings();
  
  // Set up logging based on settings
  const logLevel = settings.log_level.toUpperCase();
  if (logLevel === 'DEBUG') {
    console.error('Debug logging enabled');
  }

  const server = new GPAPIServer();
  
  try {
    await server.run();
  } catch (error) {
    if (error instanceof Error && error.name === 'SIGINT') {
      console.error('Server interrupted');
    } else {
      console.error('Server error:', error);
      process.exit(1);
    }
  } finally {
    server.cleanup();
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down...');
  process.exit(0);
});

// Run the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});