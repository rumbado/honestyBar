const productService = require('../services/product.service');
const { authorizeAdmin } = require('../middleware/auth');

async function routes(fastify, options) {
  // Initialize storage on startup
  await productService.initializeStorage();

  // Get all products (active only for regular users)
  fastify.get('/', 
    { preHandler: [fastify.authenticate],
      schema: {
        tags: ['Products'], 
        summary: 'Get all products',
        response: {
          200: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      }
     },
    async (request, reply) => {
      const products = await productService.getProducts();
      
      // If not admin, filter out inactive products
      if (request.user.role !== 'admin') {
        return products.filter(p => p.isActive);
      }
      
      return products;
    }
  );

  // Get single product
  fastify.get('/:id', 
    { preHandler: [fastify.authenticate],
      schema: {
        tags: ['Products'], 
        summary: 'Get a product by ID',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object'
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      }
     },
    async (request, reply) => {
      const product = await productService.getProduct(request.params.id);
      
      if (!product) {
        reply.code(404).send({ error: 'Product not found' });
        return;
      }

      // If not admin and product is inactive, return 404
      if (request.user.role !== 'admin' && !product.isActive) {
        reply.code(404).send({ error: 'Product not found' });
        return;
      }

      reply.send(product);
    }
  );

  // Create new product (admin only)
  fastify.post('/',
    { 
      preHandler: [fastify.authenticate, authorizeAdmin],
      schema: {
        tags: ['Products'], 
        summary: 'Create a new product',
        description: 'Admin only',
        body: {
          type: 'object',
          required: ['name', 'cost', 'price'],
          properties: {
            name: { type: 'string' },
            cost: { type: 'number', minimum: 0 },
            price: { type: 'number', minimum: 0 },
            image: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const newProduct = await productService.createProduct(request.body);
      reply.code(201).send(newProduct);
    }
  );

  // Update product (admin only)
  fastify.put('/:id',
    { 
      preHandler: [fastify.authenticate, authorizeAdmin],
      schema: {
        tags: ['Products'], 
        summary: 'Update a product',
        description: 'Admin only',
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            cost: { type: 'number', minimum: 0 },
            price: { type: 'number', minimum: 0 },
            image: { type: 'string' },
            isActive: { type: 'boolean' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const updatedProduct = await productService.updateProduct(
          request.params.id,
          request.body
        );
        reply.send(updatedProduct);
      } catch (error) {
        reply.code(404).send({ error: error.message });
      }
    }
  );

  // Delete product (admin only)
  fastify.delete('/:id',
    { preHandler: [fastify.authenticate, authorizeAdmin],
      schema: {
        tags: ['Products'], 
        summary: 'Delete a product',
        description: 'Admin only',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          }
        },
        response: {
          204: {
            description: 'No Content'
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      }
     },
    async (request, reply) => {
      try {
        await productService.deleteProduct(request.params.id);
        reply.code(204).send();
      } catch (error) {
        reply.code(404).send({ error: error.message });
      }
    }
  );
}

module.exports = routes; 