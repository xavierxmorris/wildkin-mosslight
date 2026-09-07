import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { offlineGame } from './build/offline.ts'

// https://vite.dev/config/
export default defineConfig({
  base: '/wildkin-mosslight/',
  plugins: [react(), offlineGame()],
})
