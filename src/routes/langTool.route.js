const langToolController = require('../controllers/langToolController')

module.exports = (fastify, _opts, done) => {

  fastify.route({
    method: 'POST',
    url: '/proxy',
    handler: langToolController.proxy,
    schema: {
      body: {
        type: 'object',
        required: ['language', 'text'],
        properties: {
          language: { type: 'string' },
          text: { type: 'string' }
        }
      }
    }
  })

  done()
}