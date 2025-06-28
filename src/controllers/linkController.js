const linkService = require('../services/linkService')

module.exports.linkThroughMultipart = async function (request, reply) {
  try {
    const data = await request.file()

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' })
    }

    const language = request.query.language || 'ru'

    console.log(`📤 Received file: ${data.filename || 'unknown'}`)
    console.log(`📋 MIME type: ${data.mimetype || 'unknown'}`)
    console.log(`📊 Size: ${data.file.bytesRead || 'unknown'} bytes`)

    const relayData = {
      file: {
        buffer: await data.toBuffer(),
        filename: data.filename,
        mimetype: data.mimetype
      },
      language
    }

    const result = await linkService.doLinkServiceMultipart(relayData)

    if (result) {
      reply.send({ transcript: result, language })
    } else {
      reply.status(500).send({ error: 'Failed to process audio file' })
    }
  } catch (error) {
    console.error('Controller error:', error)
    reply.status(500).send({ error: 'Internal Server Error: ' + error.message })
  }
}

module.exports.linkThroughMultipartAuto = async function (request, reply) {
  try {
    const data = await request.file()

    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' })
    }

    console.log(`📤 Received file for auto detection: ${data.filename || 'unknown'}`)
    console.log(`📋 MIME type: ${data.mimetype || 'unknown'}`)

    const relayData = {
      file: {
        buffer: await data.toBuffer(),
        filename: data.filename,
        mimetype: data.mimetype
      }
    }

    const result = await linkService.doLinkServiceMultipartAuto(relayData)
    reply.send(result)
  } catch (error) {
    console.error('Controller error:', error)
    reply.status(500).send({ error: 'Internal Server Error: ' + error.message })
  }
}

module.exports.getLanguages = async function (request, reply) {
  const languages = linkService.getAvailableLanguages()
  reply.send({ languages })
}