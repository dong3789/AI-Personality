/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  images: {
    domains: ['avatars.githubusercontent.com'],
  },

  env: {
    OLLAMA_API_URL: process.env.OLLAMA_API_URL,
    APP_URL: process.env.APP_URL,
  },
};

module.exports = nextConfig;
