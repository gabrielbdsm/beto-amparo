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
      {
        source: '/loginEmpresa', 
        destination: '/empresa/LoginEmpresa', 
      },
      {
        source: '/cadastroEmpresa', 
        destination: '/empresa/CadastroEmpresa', 
      },
      {
        source: '/adicionarProduto', 
        destination: '/empresa/AdicionarProduto', 
      },
      
    ];
  },
};

export default nextConfig;
