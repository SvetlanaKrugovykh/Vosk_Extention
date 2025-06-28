const linkController = require('../controllers/linkController')

module.exports = (fastify, _opts, done) => {

  fastify.route({
    method: 'POST',
    url: '/through/mf',
    handler: linkController.linkThroughMultipart
  })

  fastify.route({
    method: 'POST',
    url: '/through/mf/auto',
    handler: linkController.linkThroughMultipartAuto
  })

  fastify.route({
    method: 'GET',
    url: '/languages',
    handler: linkController.getLanguages
  })

  done()
}