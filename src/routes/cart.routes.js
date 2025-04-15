const cartService = require('../services/cart.service');
const productService = require('../services/product.service');
const { authorizeAdmin } = require('../middleware/auth');

async function routes(fastify, options) {
  // Initialize storage on startup
  await cartService.initializeStorage();

  // Get current user's cart
  fastify.get('/', 
    { preHandler: [fastify.authenticate],
      schema: {
        tags: ['Cart'], 
        summary: 'Get current user\'s cart',
        response: {
          200: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              items: { type: 'array', items: { type: 'object' } },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
     },
    async (request, reply) => {
      const cart = await cartService.getCart(request.user.id);
      reply.send(cart);
    }
  );

  // Add product to cart
  fastify.post('/items',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['Cart'],
        summary: 'Add product to cart',
        body: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'string' },
            quantity: { type: 'number', minimum: 1, default: 1 }
          }
        }
      }
    },
    async (request, reply) => {
      const product = await productService.getProduct(request.body.productId);
      
      if (!product || !product.isActive) {
        reply.code(404).send({ error: 'Product not found' });
        return;
      }

      const cart = await cartService.addToCart(
        request.user.id,
        product,
        request.body.quantity
      );
      reply.send(cart);
    }
  );

  // Remove product from cart
  fastify.delete('/items/:productId',
    { preHandler: [fastify.authenticate],
      schema: {
        tags: ['Cart'],
        summary: 'Remove product from cart',
        params: {
          type: 'object',
          properties: {
            productId: { type: 'string' }
          }
        }
      }
     },
    async (request, reply) => {
      const cart = await cartService.removeFromCart(
        request.user.id,
        request.params.productId
      );
      reply.send(cart);
    }
  );

  // Clear cart (user can clear their own cart, admin can clear any cart)
  fastify.delete('/:userId?',
    { preHandler: [fastify.authenticate],
      schema: {
        tags: ['Cart'], 
        summary: 'Clear cart',
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' }
          }
        }
      }
     },
    async (request, reply) => {
      const targetUserId = request.params.userId || request.user.id;
      
      // If trying to clear someone else's cart, must be admin
      if (targetUserId !== request.user.id) {
        await authorizeAdmin(request, reply);
      }

      const cart = await cartService.clearCart(targetUserId);
      reply.send(cart);
    }
  );

  // Checkout (purchase) cart
  fastify.post('/checkout',
    { preHandler: [fastify.authenticate],
      schema: {
        tags: ['Cart'], 
        summary: 'Clear cart and add to purchase history',
      }
     },
    async (request, reply) => {
      const cart = await cartService.getCart(request.user.id);
      
      if (cart.items.length === 0) {
        reply.code(400).send({ error: 'Cart is empty' });
        return;
      }

      // Add to purchase history
      const purchase = await cartService.addToPurchaseHistory(request.user.id, cart);
      
      // Clear the cart
      await cartService.clearCart(request.user.id);

      reply.send(purchase);
    }
  );

  // Get purchase history
  fastify.get('/history/:userId?',
    { preHandler: [fastify.authenticate],
      schema: {
        tags: ['Cart'], 
        summary: 'Get purchase history',
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' }
          }
        }
      }
     },
    async (request, reply) => {
      const targetUserId = request.params.userId || request.user.id;
      
      // If trying to view someone else's history, must be admin
      if (targetUserId !== request.user.id) {
        await authorizeAdmin(request, reply);
      }

      const history = await cartService.getPurchaseHistory(targetUserId);
      reply.send(history);
    }
  );
}

module.exports = routes; 