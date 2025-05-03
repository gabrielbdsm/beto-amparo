/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: ['cufzswdymzevdeonjgan.supabase.co'],
  },

  async rewrites() {
    return [
      {
        source: '/produto/:id', // URL personalizada
        destination: '/client/produto', // Arquivo de destino
      },
    ];
  },
};

export default nextConfig;
