module.exports = {
  description: 'Sign string with multipart/form-data',
  tags: ['sign'],
  summary: 'Sign string with multipart/form-data',
  consumes: ['multipart/form-data'],
  body: {
    type: 'object',
    required: ['file'],
    properties: {
      file: { type: 'string', format: 'binary' }
    }
  },
  response: {
    201: {
      description: 'Successful response',
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        transcript: { type: 'string' }
      }
    },
    500: {
      description: 'Internal server error',
      type: 'object',
      properties: {
        statusCode: { type: 'integer' },
        error: { type: 'string' },
        message: { type: 'string' }
      }
    }
  }
}