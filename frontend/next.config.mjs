import os from 'os';

// Programmatically find all local network addresses
const networkInterfaces = os.networkInterfaces();
const localOrigins = Object.values(networkInterfaces)
  .flat()
  .filter((iface) => iface.family === 'IPv4' && !iface.internal)
  .map((iface) => iface.address);

// Grab the primary Wi-Fi/LAN IP (e.g., 192.168.1.X)
const primaryIp = localOrigins.length > 0 ? localOrigins[0] : '127.0.0.1';
const backendUrl = process.env.BACKEND_URL || `http://${primaryIp}:8000`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  allowedDevOrigins: [
    ...localOrigins,
    `${os.hostname()}.local`, 
    'localhost:3000',
    '0.0.0.0:3000'
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Route directly to the backend
        destination: `${backendUrl}/api/:path*`
      },
    ];
  },
};

export default nextConfig;