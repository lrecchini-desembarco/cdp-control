/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // mssql (y su driver tedious) usan require dinámicos: mantenerlo fuera del
  // bundle del servidor evita warnings y que se cargue cuando no se usa (mock).
  experimental: { serverComponentsExternalPackages: ["mssql"] },
};
export default nextConfig;
