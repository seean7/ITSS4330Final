import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Project Pages is served at https://<user>.github.io/<repo>/
const repoBase = '/ITSS4330Final/'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? repoBase : '/',
  plugins: [react(), tailwindcss()],
}))
