import { defineConfig } from 'vite'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  server: { port: 5173 },
  plugins: [
    {
      name: 'sw-version',
      closeBundle() {
        const swPath = resolve('./dist/sw.js')
        const ver = Date.now().toString(36)
        const content = readFileSync(swPath, 'utf-8')
        writeFileSync(swPath, content.replace('__VER__', ver))
      },
    },
  ],
})
