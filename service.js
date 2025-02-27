const Service = require('node-windows').Service
const path = require('path')

const scriptPath = path.join(__dirname, 'server.js')

const svc = new Service({
  name: 'VoskExtensionService',
  description: 'Node.js service for Vosk Extension',
  script: scriptPath,
  env: {
    name: "NODE_ENV",
    value: "production"
  }
})

svc.on('install', () => {
  svc.start()
})

svc.install()