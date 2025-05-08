// Simple runner script for Node.js server
// This allows the server to be run with proper environment variables in Replit workflows
console.log('Starting server.js...');
import('./server.js').catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});