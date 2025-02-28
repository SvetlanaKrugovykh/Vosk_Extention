const langToolService = require('../services/langTool')

module.exports.proxy = async function (request, reply) {
  const { language, text } = request.body

  try {
    const result = await langToolService.proxy(language, text)
    reply.send(result)
  } catch (error) {
    reply.status(500).send({ error: 'Internal Server Error' })
  }
}