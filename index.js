const Fastify = require('fastify')
require('dotenv').config()

const app = Fastify({
  logger: true,
  bodyLimit: 100 * 1024 * 1024
})

app.register(require('@fastify/multipart'), {
  limits: {
    fieldNameSize: 100,
    fieldSize: 1024 * 1024,
    fields: 10,
    fileSize: 100 * 1024 * 1024,
    files: 1,
    headerPairs: 2000
  }
})

app.addContentTypeParser('application/json', { parseAs: 'string' }, app.getDefaultJsonParser('ignore', 'ignore'))

app.addContentTypeParser('application/x-www-form-urlencoded', (request, payload, done) => {
  let body = ''
  payload.on('data', data => {
    body += data
  })
  payload.on('end', () => {
    const parsed = require('querystring').parse(body)
    done(null, parsed)
  })
})

app.register(require('./src/routes/tvs.route'), { prefix: '/api/link' })
app.register(require('./src/routes/langTool.route'), { prefix: '/api/langTool' })



module.exports = { app }