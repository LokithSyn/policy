import { NextResponse } from 'next/server';
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IntelliPolicy API',
      version: '1.0.0',
      description: 'Insurance Policy Management & Verification Portal API',
      contact: {
        name: 'IntelliDoc',
        url: 'https://intellidoc.io',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: process.env.NEXT_PUBLIC_API_URL || 'https://api.intellipolicy.com',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        Policy: {
          type: 'object',
          properties: {
            policyId: { type: 'string' },
            policyNumber: { type: 'string' },
            customerId: { type: 'string' },
            customerName: { type: 'string' },
            policyType: { type: 'string', enum: ['Motor', 'Health', 'Property', 'Life', 'Travel'] },
            sumInsured: { type: 'number' },
            policyStatus: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'] },
            effectiveDate: { type: 'string', format: 'date-time' },
            expiryDate: { type: 'string', format: 'date-time' },
            premiumAmount: { type: 'number' },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            customerId: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            mobile: { type: 'string' },
            city: { type: 'string' },
            state: { type: 'string' },
          },
        },
        ValidationResult: {
          type: 'object',
          properties: {
            valid: { type: 'boolean' },
            policyStatus: { type: 'string' },
            customerName: { type: 'string' },
            coverageAvailable: { type: 'boolean' },
            claimCount: { type: 'number' },
            fraudAlert: { type: 'boolean' },
            rejectionReason: { type: 'string' },
            approvedAmount: { type: 'number' },
          },
        },
      },
    },
    paths: {
      '/api/policies': {
        get: {
          tags: ['Policies'],
          summary: 'List all policies',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'List of policies' } },
        },
      },
      '/api/policies/{policyNumber}': {
        get: {
          tags: ['Policies'],
          summary: 'Get policy by number',
          parameters: [{ name: 'policyNumber', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Policy details' } },
        },
      },
      '/api/policies/{policyNumber}/coverage': {
        get: {
          tags: ['Coverage'],
          summary: 'Get coverages for a policy',
          parameters: [{ name: 'policyNumber', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'List of coverages' } },
        },
      },
      '/api/policies/{policyNumber}/claims': {
        get: {
          tags: ['Claims'],
          summary: 'Get claims for a policy',
          parameters: [{ name: 'policyNumber', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'List of claims' } },
        },
      },
      '/api/policies/verify/{policyNumber}': {
        get: {
          tags: ['Verification'],
          summary: 'Verify policy',
          parameters: [{ name: 'policyNumber', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Verification result' } },
        },
      },
      '/api/customers/{customerId}': {
        get: {
          tags: ['Customers'],
          summary: 'Get customer details',
          parameters: [{ name: 'customerId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Customer details' } },
        },
      },
      '/api/vehicles/{registrationNumber}': {
        get: {
          tags: ['Vehicles'],
          summary: 'Get vehicle details',
          parameters: [{ name: 'registrationNumber', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Vehicle details' } },
        },
      },
      '/api/claims/validate': {
        post: {
          tags: ['Claims'],
          summary: 'Validate a claim',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    policyNumber: { type: 'string' },
                    claimAmount: { type: 'number' },
                  },
                  required: ['policyNumber', 'claimAmount'],
                },
              },
            },
          },
          responses: { '200': { description: 'Validation result' } },
        },
      },
    },
  },
  apis: [],
};

const spec = swaggerJsdoc(options);

export async function GET() {
  return NextResponse.json(spec);
}
