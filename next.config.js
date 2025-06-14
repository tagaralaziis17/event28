/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['mysql2']
  },
  images: {
    domains: ['localhost', '10.10.11.28', 'via.placeholder.com'],
  },
}

module.exports = nextConfig