import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from './swagger.config.js';

export const swaggerSpec = swaggerJsdoc(swaggerOptions);