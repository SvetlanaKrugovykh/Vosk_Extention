const linkController = require('../controllers/linkController')
const linkSchemaMf = require('../schemas/link.schemaMf')

module.exports = (fastify, _opts, done) => {

  fastify.route({
    method: 'POST',
    url: '/through/mf',
    handler: linkController.linkThroughMultipart,
    // schema: linkSchemaMf
  })

  done()
}