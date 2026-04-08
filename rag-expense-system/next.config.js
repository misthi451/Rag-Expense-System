/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for fs module usage in API routes on Vercel
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
