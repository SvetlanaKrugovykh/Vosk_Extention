const HttpError = require('http-errors')
const linkService = require('../services/linkService')

module.exports.linkThroughMultipart = async function (request, _reply) {
  const parts = request.parts()
  let file, originalname

  try {
    for await (const part of parts) {
      if (part.fieldname === 'file') {
        file = part.file
        originalname = part.filename || 'file'
        const chunks = []
        for await (const chunk of file) {
          chunks.push(chunk)
        }
        file = Buffer.concat(chunks)
      }
    }
  } catch (err) {
    throw new HttpError[400]('Error processing multipart data')
  }

  if (!file) {
    throw new HttpError[400]('Missing required fields')
  }

  const relayData = {
    file: {
      buffer: file,
      originalname: originalname
    }
  }
  const replyData = await linkService.doLinkServiceMultipart(relayData)

  if (!replyData) {
    throw new HttpError[500]('Command execution failed')
  }

  return {
    replyData
  }
}