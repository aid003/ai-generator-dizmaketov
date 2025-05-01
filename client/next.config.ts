/** @type {import('next').NextConfig} */
export default {
  async rewrites() {
    return [
      { source: '/:domain([^/]+)',        destination: '/api/proxy/:domain' },
      { source: '/:domain([^/]+)/:path*', destination: '/api/proxy/:domain/:path*' },
    ];
  },
};
