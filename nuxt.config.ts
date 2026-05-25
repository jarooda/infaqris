import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@nuxt/icon', '@vite-pwa/nuxt', '@nuxt/eslint'],
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
    public: {
      googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'InfaQRIS',
      short_name: 'InfaQRIS',
      description: 'Crowdsourced QRIS location tracker',
      theme_color: '#2563eb',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        {
          src: '/android-chrome-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
        { src: '/infaqris.png', sizes: '800x800', type: 'image/png', purpose: 'any' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
})
