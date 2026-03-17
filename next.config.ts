/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/creation/:path*", // intercept /api/* calls
        destination: "http://localhost:8080/api/:path*", // proxy to Ktor backend
      },
      {
        source: "/api/persistence/:path*", // intercept /api/* calls
        destination: "http://localhost:8081/api/:path*", // proxy to Ktor backend
      },
    ];
  },
};

module.exports = nextConfig;
