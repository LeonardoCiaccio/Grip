#!/usr/bin/env node
'use strict'

const http = require('http')
const fs   = require('fs')
const path = require('path')

const PORT    = process.env.PORT ? parseInt(process.env.PORT) : 3000
const PROJECT = path.resolve(__dirname, '..')   // repo root
const EXAMPLE = path.join(PROJECT, 'example')  // served as /

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.woff2':'font/woff2',
}

function resolve(urlPath) {
  // /core/... and /node_modules/... are served from project root
  if (urlPath.startsWith('/core/') || urlPath.startsWith('/node_modules/')) {
    return path.normalize(path.join(PROJECT, urlPath))
  }
  return path.normalize(path.join(EXAMPLE, urlPath))
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0].replace(/\/+/g, '/')
  if (urlPath === '/') urlPath = '/index.html'

  const filePath = resolve(urlPath)

  // Security: must stay within project root
  if (!filePath.startsWith(PROJECT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' })
    res.end('403 Forbidden')
    return
  }

  let target = filePath
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    target = path.join(target, 'index.html')
  }

  if (!fs.existsSync(target)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('404 Not found: ' + urlPath)
    return
  }

  const ext     = path.extname(target).toLowerCase()
  const mime    = MIME[ext] || 'application/octet-stream'
  const content = fs.readFileSync(target)

  res.writeHead(200, { 'Content-Type': mime })
  res.end(content)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log('')
  console.log('  GRIP Examples')
  console.log(`  → http://localhost:${PORT}`)
  console.log('')
  console.log('  Press Ctrl+C to stop.')
  console.log('')
})

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use. Try PORT=3001 npm run example\n`)
  } else {
    console.error('\n  Server error:', err.message, '\n')
  }
  process.exit(1)
})
