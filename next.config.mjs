import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['192.168.31.120', '172.16.15.232', '172.16.15.232','192.168.*.*'],
  productionBrowserSourceMaps: false,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
