/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    domains: ['cufzswdymzevdeonjgan.supabase.co'],
  },

  async rewrites() {
    return [
      {
        source: '/loja/produto/:site/:id',
        destination: '/client/produto',
      },
      {
        source: '/:slug/carrinho',
        destination: '/client/carrinho',
      },
      {
        source: '/loja/:site',
        destination: '/client/ClienteHome',
      },
      {
        source: '/cadastro',
        destination: '/client/cadastrar_cliente',
      },
      {
        source: '/login',
        destination: '/client/loginCliente',
      },
      {
        source: '/empresa/personalizar',
        destination: '/empresa/personalizacao-loja',
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
        source: '/empresa/adicionarProduto',
        destination: '/empresa/AdicionarProduto',
      },
    ];
  },
};

module.exports = nextConfig;
