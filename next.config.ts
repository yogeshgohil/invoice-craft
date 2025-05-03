
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Expose environment variables to the browser
  env: {
    // This makes MONGODB_URI available only on the server-side (default behaviour)
    // MONGODB_URI: process.env.MONGODB_URI, // No need to explicitly list server-only vars

    // Example: If you needed the base URL client-side for API calls in different environments
    // Ensure you prefix client-side vars with NEXT_PUBLIC_
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '', // Provide a fallback like empty string
  },
};

export default nextConfig;
