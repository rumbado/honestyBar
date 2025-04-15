const userService = require('../services/user.service');
const { authorizeAdmin } = require('../middleware/auth');

async function routes(fastify, options) {
  // Initialize storage on startup
  await userService.initializeStorage();

  // Login route
  fastify.post('/login', async (request, reply) => {
    const { name, password } = request.body;

    const user = await userService.findByUsername(name);
    if (!user) {
      reply.code(401).send({ error: 'Invalid credentials' });
      return;
    }

    const valid = await userService.validatePassword(user, password);
    if (!valid) {
      reply.code(401).send({ error: 'Invalid credentials' });
      return;
    }

    const token = fastify.jwt.sign({ 
      id: user.id, 
      name: user.name,
      role: user.role 
    });

    reply.send({ token });
  });

  // Create new user (admin only)
  fastify.post('/',
    { preHandler: [fastify.authenticate, authorizeAdmin] },
    async (request, reply) => {
      const newUser = await userService.createUser(request.body);
      reply.code(201).send(newUser);
    }
  );

  // Delete user (admin only)
  fastify.delete('/:id',
    { preHandler: [fastify.authenticate, authorizeAdmin] },
    async (request, reply) => {
      await userService.deleteUser(request.params.id);
      reply.code(204).send();
    }
  );

  // Get current user profile
  fastify.get('/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await userService.findByUsername(request.user.name);
      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }
      const { password, ...userWithoutPassword } = user;
      reply.send(userWithoutPassword);
    }
  );
}

module.exports = routes; 