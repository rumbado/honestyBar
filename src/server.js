const fastify = require('fastify')({ logger: true });
const jwt = require('@fastify/jwt');
const userRoutes = require('./routes/user.routes');
const { authenticate } = require('./middleware/auth');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');

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
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 