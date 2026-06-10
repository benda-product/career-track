import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CareerTrack API',
      version: '1.0.0',
      description: 'Enterprise Candidate Platform API - integrates Resume Builder and ATS services',
      contact: { name: 'CareerTrack', email: 'api@careertrack.com' },
    },
    servers: [
      { url: `http://localhost:${env.port}/api/v1`, description: 'Development' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['candidate', 'admin'] },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },
        Application: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            jobId: { type: 'string' },
            jobTitle: { type: 'string' },
            company: { type: 'string' },
            stage: {
              type: 'string',
              enum: ['applied', 'screening', 'shortlisted', 'interview', 'offer', 'rejected', 'hired'],
            },
            appliedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/modules/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
