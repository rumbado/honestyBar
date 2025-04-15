const authenticate = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
};

const authorizeAdmin = async (request, reply) => {
  if (request.user.role !== 'admin') {
    reply.code(403).send({ error: 'Forbidden - Admin access required' });
  }
};

module.exports = {
  authenticate,
  authorizeAdmin
}; 