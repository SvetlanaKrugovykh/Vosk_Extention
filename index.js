const Fastify = require('fastify')
require('dotenv').config()

const app = Fastify({ logger: true })

app.register(require('@fastify/multipart'))
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