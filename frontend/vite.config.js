import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.env', 'VITE_')

  return {
    plugins: [react()],
    server: {
      port: 5173,
    },
    envDir: '.env',
  }
})
