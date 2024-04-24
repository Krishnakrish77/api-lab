const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: 'My API Documentation',
      version: '1.0.0',
      description: 'Documentation for my API endpoints',
    },
  },
  apis: ['./app/*.js'], // Path to the API routes files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = {
  serveSwaggerUI: swaggerUi.serve,
  setupSwaggerUI: swaggerUi.setup(swaggerSpec),
};
