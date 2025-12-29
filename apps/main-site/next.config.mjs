import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mdxusjaxhypvuprmzgif.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'apex27.co.uk',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'apex27.co.uk',
        pathname: '/**',
      },
      // Apex27 file storage subdomains
      {
        protocol: 'https',
        hostname: 'fs-01.apex27.co.uk',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fs-02.apex27.co.uk',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fs-03.apex27.co.uk',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fs-04.apex27.co.uk',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fs-05.apex27.co.uk',
        pathname: '/**',
      },
    ],
  },
}

export default withPayload(nextConfig)
