const Fastify = require('fastify')
require('dotenv').config()

const app = Fastify({ logger: true })

app.register(require('@fastify/multipart'))
app.addContentTypeParser('application/json', { parseAs: 'string' }, app.getDefaultJsonParser('ignore', 'ignore'))

app.register(require('./src/routes/tvs.route'), { prefix: '/api/link' })



module.exports = { app }