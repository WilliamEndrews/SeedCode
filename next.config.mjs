/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // As Server Actions do Next.js validam a origem (Origin) da requisição
    // contra o host do servidor. Ao acessar via proxy (ex.: browser preview do
    // editor), a origem difere do host e o Next rejeita com
    // "Invalid Server Actions request". Aqui autorizamos as origens usadas em
    // desenvolvimento — incluindo o proxy local em portas dinâmicas.
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        "127.0.0.1:3000",
        "127.0.0.1:3001",
      ],
    },
  },
};

export default nextConfig;
