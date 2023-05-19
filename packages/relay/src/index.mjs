import url from 'url'
import path from 'path'
import fs from 'fs'
import express from 'express'
import { ETH_PROVIDER_URL, PRIVATE_KEY, provider } from './config.mjs'
import TransactionManager from './TransactionManager.mjs'

await TransactionManager.configure(PRIVATE_KEY, provider)
await TransactionManager.start()

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const app = express()
const port = process.env.PORT ?? 8000
app.listen(port, () => console.log(`HTTP on port ${port}`))
app.use('*', (req, res, next) => {
  res.set('access-control-allow-origin', '*')
  res.set('access-control-allow-headers', '*')
  next()
})
app.use(express.json())
app.use('/build', express.static(path.join(__dirname, '../keys')))

const state = { app }
await importFunctionDirectory('routes', state)

// name relative to file location
async function importFunctionDirectory(dirname, state) {
  // import all non-index files from __dirname/name this folder
  const routeDir = path.join(__dirname, dirname)
  const routes = await fs.promises.readdir(routeDir)
  for (const routeFile of routes) {
    const { default: route } = await import(path.join(routeDir, routeFile))
    route(state)
  }
}
