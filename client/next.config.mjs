/** @type {import('next').NextConfig} */

const nextConfig = {

  images: {

    remotePatterns: [

      {

        protocol: "http",

        hostname: "localhost",

        port: "8000",

        pathname: "/**",

      },

      // This pattern handles external access to your server

      {

        protocol: "http", // Change to https after SSL setup

        hostname: "intranet.insight-times.com",

        port: "", // Standard port

        pathname: "/**",

      },

    ],

  },

  // Add this rewrites configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
};

export default nextConfig;
