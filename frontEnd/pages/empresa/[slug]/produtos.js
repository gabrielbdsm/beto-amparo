// pages/empresa/[slug]/produtos.js

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

// Importa os módulos do Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Importa os estilos do Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import OwnerSidebar from '@/components/OwnerSidebar';
import AdminProductCard from '@/components/AdminProductCard';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function ProdutosDaLoja() {
  const router = useRouter();
  const { slug } = router.query;

  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToHandle, setProductToHandle] = useState(null);
  const [actionType, setActionType] = useState(''); // 'inativar'
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);

  // Função de Editar Produto
  const handleEditProduct = (productId) => {
    router.push(`/empresa/${slug}/editar-produto/${productId}`);
  };

  // Funções para o modal de confirmação de inativação
  const handleOpenConfirmModal = (product, type) => {
    setProductToHandle(product);
    setActionType(type);
    setIsModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIsModalOpen(false);
    setProductToHandle(null);
    setActionType('');
    setIsConfirmingAction(false);
  };

  const handleConfirmAction = async () => {
    if (!productToHandle || actionType !== 'inativar') return; // Ação só para inativar aqui

    setIsConfirmingAction(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos/inativar/${productToHandle.id}`, {
        method: 'PUT',
        credentials: 'include',
      });

      if (response.status === 401) {
        const errorData = await response.json();
        const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
        router.push(targetUrl);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensagem || `Erro HTTP ${response.status} ao inativar produto.`);
      }

      // Remove o produto da lista localmente
      setProdutos(prevProdutos => prevProdutos.filter(p => p.id !== productToHandle.id));
      alert('Produto inativado com sucesso!');
      handleCloseConfirmModal();

    } catch (err) {
      console.error('Erro ao inativar produto:', err);
      setError(err.message || 'Não foi possível inativar o produto. Verifique o console do backend.');
      setIsConfirmingAction(false);
    }
  };

  // Efeito para buscar produtos (ativos)
  useEffect(() => {
    if (!router.isReady || !slug) {
      return;
    }

    const fetchProdutos = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos/loja/${slug}?ativo=true`, {
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.status === 401) {
          const errorData = await response.json();
          const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
          router.push(targetUrl);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.mensagem || `Erro HTTP ${response.status} ao carregar produtos do backend.`);
        }

        const data = await response.json();
        const activeProducts = data
            .filter(p => p.hasOwnProperty('ativo') ? p.ativo === true : true)
            .map(p => ({
                ...p,
                categoria_nome: p.categorias?.nome || 'Outros'
            }));
        setProdutos(activeProducts);
        console.log("Frontend: Produtos ativos recebidos com sucesso:", activeProducts);

      } catch (err) {
        console.error("Frontend: Erro ao buscar produtos:", err);
        setError(err.message || 'Não foi possível carregar os produtos do backend. Verifique o console do backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchProdutos();
  }, [slug, router.isReady, router]);

  // Função para obter a URL da imagem do produto
  const getImagemProduto = (imagePathOrFullUrl) => {
    if (imagePathOrFullUrl && (imagePathOrFullUrl.startsWith('http://') || imagePathOrFullUrl.startsWith('https://'))) {
      return imagePathOrFullUrl;
    }
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/+$/, '') : '';
    if (imagePathOrFullUrl) {
      // Usando 'produto.image' aqui, verifique a consistência com seu AdminProductCard
      return `${baseUrl}/uploads/produtos/${imagePathOrFullUrl}`;
    }
    return '/placeholder.png';
  };

  // Lógica para Agrupar Produtos por Categoria
  const produtosPorCategoria = useMemo(() => {
    const grouped = {};
    produtos.forEach(produto => {
      const categoria = produto.categoria_nome || 'Outros';
      if (!grouped[categoria]) {
        grouped[categoria] = [];
      }
      grouped[categoria].push(produto);
    });
    return grouped;
  }, [produtos]);

  const pageContent = (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-lg shadow-md min-h-[600px]">
      <h1 className="text-3xl font-bold text-[#3681B6] mb-6">Meus Produtos (Dashboard)</h1>

      <div className="mb-6 flex justify-between items-center">
        {slug && (
          <Link href={`/empresa/${slug}/AdicionarProduto`} className="bg-green-600 text-white py-2 px-5 rounded-lg shadow-md hover:bg-green-700 transition duration-200 text-lg">
            Adicionar Novo Produto
          </Link>
        )}
        {!slug && (
          <span className="text-gray-500">Aguardando detalhes da empresa para ativar os botões...</span>
        )}
        <Link href={`/empresa/${slug}/produtos/inativos`} className="ml-4 text-[#3681B6] hover:underline">
          Ver Produtos Inativos
        </Link>
      </div>

      {loading ? (
        <div className="text-center p-8 text-xl text-gray-700">Carregando produtos...</div>
      ) : error ? (
        <div className="text-center p-8 text-red-600 font-semibold">
          Erro: {error}
          <p className="mt-2 text-sm text-gray-500">Verifique os logs do terminal do seu backend para mais detalhes.</p>
        </div>
      ) : Object.keys(produtosPorCategoria).length > 0 ? (
        <div>
          {Object.entries(produtosPorCategoria).map(([categoria, produtosDaCategoria]) => (
            <div key={categoria} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                {categoria}
              </h2>
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={20}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                breakpoints={{
                  640: {
                    slidesPerView: 2,
                    spaceBetween: 20,
                  },
                  1024: {
                    slidesPerView: 3,
                    spaceBetween: 30,
                  },
                }}
                className="mySwiper"
              >
                {produtosDaCategoria.map((produto) => (
                  <SwiperSlide key={produto.id}>
                    <AdminProductCard
                      produto={produto}
                      getImagemProduto={getImagemProduto}
                      onEdit={handleEditProduct} // Passa a função de edição
                      // *** CORREÇÃO AQUI para o botão de Inativar ***
                      onStatusChange={() => handleOpenConfirmModal(produto, 'inativar')} // CHAMA A FUNÇÃO DE INATIVAR
                      buttonLabel="Inativar" // Label para o botão
                      // Não passe onPermanentDelete aqui, pois não queremos a lixeira nesta página
                      // onPermanentDelete={undefined} ou simplesmente não passar a prop.
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 text-gray-600">
          <p>Nenhum produto ativo cadastrado para esta empresa ainda.</p>
          <p className="mt-2">Use o botão "Adicionar Novo Produto" para começar!</p>
        </div>
      )}
    </div>
  );

  return (
    <OwnerSidebar slug={slug}>
      {pageContent}
      <ConfirmationModal
        isOpen={isModalOpen}
        title={actionType === 'inativar' ? 'Confirmar Inativação' : 'Ação Desconhecida'}
        message={
          actionType === 'inativar'
            ? `Tem certeza que deseja inativar o produto "${productToHandle?.nome || ''}"? Ele não aparecerá mais na loja para os clientes.`
            : `Confirma esta ação para o produto "${productToHandle?.nome || ''}"?`
        }
        onConfirm={handleConfirmAction}
        onCancel={handleCloseConfirmModal}
        isConfirming={isConfirmingAction}
        actionLabel={actionType === 'inativar' ? 'Inativar' : 'Confirmar'}
      />
    </OwnerSidebar>
  );
}