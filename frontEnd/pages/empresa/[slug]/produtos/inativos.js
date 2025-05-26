// pages/empresa/[slug]/produtos/inativos.js
import { useState, useEffect, useMemo } from 'react'; // Adicionado useMemo
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';

// Importa os módulos do Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules'; // Importe os módulos que vai usar

// Importa os estilos do Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import OwnerSidebar from '@/components/OwnerSidebar';
import AdminProductCard from '@/components/AdminProductCard';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function ProdutosInativosPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [produtosInativos, setProdutosInativos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToHandle, setProductToHandle] = useState(null);
  const [actionType, setActionType] = useState('');
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);

  // Função para lidar com a ação de ativar (chamada pelo AdminProductCard)
  const handleOpenConfirmActivateModal = (product) => {
    setProductToHandle(product);
    setActionType('ativar');
    setIsModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIsModalOpen(false);
    setProductToHandle(null);
    setActionType('');
    setIsConfirmingAction(false);
  };

  const handleConfirmAction = async () => {
    if (!productToHandle || actionType !== 'ativar') return;

    setIsConfirmingAction(true);
    setError(null);

    const endpoint = `${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos/ativar/${productToHandle.id}`;

    try {
      const response = await fetch(endpoint, {
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
        throw new Error(errorData.mensagem || `Erro HTTP ${response.status} ao ativar produto.`);
      }

      setProdutosInativos(prevProdutos => prevProdutos.filter(p => p.id !== productToHandle.id));
      alert('Produto ativado com sucesso!');
      handleCloseConfirmModal();

    } catch (err) {
      console.error(`Erro ao ativar produto:`, err);
      setError(err.message || `Não foi possível ativar o produto. Verifique o console do backend.`);
      setIsConfirmingAction(false);
    }
  };

  useEffect(() => {
    if (!router.isReady || !slug) {
      return;
    }

    const fetchProdutosInativos = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos/loja/${slug}?ativo=false`, {
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
          throw new Error(errorData.mensagem || `Erro HTTP ${response.status} ao carregar produtos inativos.`);
        }

        const data = await response.json();
        setProdutosInativos(data.filter(p => p.hasOwnProperty('ativo') ? p.ativo === false : false));
        console.log("Frontend: Produtos inativos recebidos com sucesso:", data);

      } catch (err) {
        console.error("Frontend: Erro ao buscar produtos inativos:", err);
        setError(err.message || 'Não foi possível carregar os produtos inativos. Verifique o console do backend.');
      } finally {
        setLoading(false);
      }
    };

    fetchProdutosInativos();
  }, [slug, router.isReady, router]);

  const getImagemProduto = (imagePathOrFullUrl) => {
    if (imagePathOrFullUrl && (imagePathOrFullUrl.startsWith('http://') || imagePathOrFullUrl.startsWith('https://'))) {
      return imagePathOrFullUrl;
    }
    if (imagePathOrFullUrl) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/uploads/produtos/${imagePathOrFullUrl}`;
    }
    return '/placeholder.png';
  };

  // Lógica para Agrupar Produtos por Categoria (mantida como está)
  const produtosPorCategoria = useMemo(() => {
    const grouped = {};
    produtosInativos.forEach(produto => {
      const categoria = produto.categoria || 'Outros';
      if (!grouped[categoria]) {
        grouped[categoria] = [];
      }
      grouped[categoria].push(produto);
    });
    return grouped;
  }, [produtosInativos]);

  const pageContent = (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-lg shadow-md min-h-[600px]">
      <h1 className="text-3xl font-bold text-[#3681B6] mb-6">Produtos Inativos</h1>

      <div className="mb-6 flex justify-between items-center">
        {slug && (
          <Link href={`/empresa/${slug}/produtos`} className="bg-gray-600 text-white py-2 px-5 rounded-lg shadow-md hover:bg-gray-700 transition duration-200 text-lg">
            Voltar para Produtos Ativos
          </Link>
        )}
        {!slug && (
          <span className="text-gray-500">Aguardando detalhes da empresa...</span>
        )}
      </div>

      {loading ? (
        <div className="text-center p-8 text-xl text-gray-700">Carregando produtos inativos...</div>
      ) : error ? (
        <div className="text-center p-8 text-red-600 font-semibold">
          Erro: {error}
          <p className="mt-2 text-sm text-gray-500">Verifique os logs do terminal do seu backend para mais detalhes.</p>
        </div>
      ) : Object.keys(produtosPorCategoria).length > 0 ? (
        // Renderiza produtos agrupados por categoria com Swiper
        <div>
          {Object.entries(produtosPorCategoria).map(([categoria, produtosDaCategoria]) => (
            <div key={categoria} className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                {categoria}
              </h2>
              <Swiper
                modules={[Navigation, Pagination]} // Adicione os módulos de navegação e paginação
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
                    <div className="w-full flex justify-center">
                      <AdminProductCard
                        produto={produto}
                        getImagemProduto={getImagemProduto}
                        onEdit={null} // Produtos inativos talvez não possam ser editados daqui
                        onDelete={() => handleOpenConfirmActivateModal(produto)}
                        buttonLabel="Ativar"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 text-gray-600">
          <p>Nenhum produto inativo para esta empresa.</p>
        </div>
      )}
    </div>
  );

  return (
    <OwnerSidebar slug={slug}>
      {pageContent}
      <ConfirmationModal
        isOpen={isModalOpen}
        title={actionType === 'ativar' ? 'Confirmar Ativação' : 'Ação Desconhecida'}
        message={
          actionType === 'ativar'
            ? `Tem certeza que deseja ativar o produto "${productToHandle?.nome || ''}"? Ele voltará a aparecer na loja.`
            : 'Confirma esta ação?'
        }
        onConfirm={handleConfirmAction}
        onCancel={handleCloseConfirmModal}
        isConfirming={isConfirmingAction}
        actionLabel="Ativar" // Ação específica para este modal
      />
    </OwnerSidebar>
  );
}