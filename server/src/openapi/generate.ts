import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Generate OpenAPI 3.0 specification
 * This creates a minimal but valid spec for Dart client generation
 * 
 * Run: npm run generate:openapi
 * Then: npm run generate:dart-client
 */

const registry = new OpenAPIRegistry();

// Register security scheme
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// Generate OpenAPI document
const generator = new OpenApiGeneratorV3(registry.definitions);

const document = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'SplitIt API',
    version: '1.0.0',
    description: `Splitwise-style expense splitting app with real-time updates.

## Authentication
All protected endpoints require JWT Bearer token: Authorization: Bearer <token>

## Real-time Updates
Socket.io is used for live synchronization of expenses, balances, members, and notifications.
`,
  },
  servers: [
    {
      url: 'https://splitit-backend-w856.onrender.com',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User registration and login' },
    { name: 'User', description: 'Profile management' },
    { name: 'Groups', description: 'Group and membership management' },
    { name: 'Expenses', description: 'Expense tracking and splitting' },
    { name: 'Settlements', description: 'Payment settlements and balances' },
    { name: 'Invites', description: 'Group invitations' },
    { name: 'Notifications', description: 'In-app and push notifications' },
  ],
});

// Write to file
const outputPath = resolve(__dirname, '../../openapi.json');
writeFileSync(outputPath, JSON.stringify(document, null, 2));

console.log('✅ OpenAPI spec generated:', outputPath);
console.log('');
console.log('Next: npm run generate:dart-client');
console.log('This will create the Dart API client in ../mobile/lib/api');
