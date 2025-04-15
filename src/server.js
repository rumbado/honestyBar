const fastify = require('fastify')({ logger: true });
const jwt = require('@fastify/jwt');
const swagger = require('@fastify/swagger');
const swaggerUi = require('@fastify/swagger-ui');
const userRoutes = require('./routes/user.routes');
const { authenticate } = require('./middleware/auth');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');

// Register Swagger
fastify.register(swagger, {
  swagger: {
    info: {
      title: 'HonestyBar API',
      description: 'API documentation for HonestyBar',
      version: '1.0.0'
    },
    host: 'localhost:3000',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  }
});

fastify.register(swaggerUi, {
  routePrefix: '/docs', // Documentation will be available at /docs
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
});

// Register JWT
fastify.register(jwt, {
  secret: 'your-secret-key-change-this-in-production'
});

// Register authentication decorator
fastify.decorate('authenticate', authenticate);

// Register routes
fastify.register(userRoutes, { prefix: '/api/users' });
fastify.register(productRoutes, { prefix: '/api/products' });
fastify.register(cartRoutes, { prefix: '/api/cart' });

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    fastify.swagger(); // Generate Swagger documentation
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 