// pages/empresa/[slug]/editar-produto/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
// import LogoutButton from 'components/LogoutButton'; // Esta linha será removida ou comentada
import ProductFormulario from 'components/ProductFormulario';

export default function EditarProdutoPage() {
  const router = useRouter();
  const { slug, id } = router.query;

  const [productData, setProductData] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/verifyAuthStatus`, {
          method: 'GET',
          credentials: 'include',
        });

        if (response.status === 401) {
          const errorData = await response.json();
          const targetUrl = errorData.redirectTo || `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
          router.push(targetUrl);
          return;
        }
      } catch (err) {
        const targetUrl = `/empresa/LoginEmpresa?returnTo=${encodeURIComponent(router.asPath)}`;
        router.push(targetUrl);
      } finally {
        setIsAuthChecking(false);
      }
    };

    if (router.isReady) {
      checkAuthStatus();

      if (id) {
        const fetchProduct = async () => {
          try {
            setIsLoadingProduct(true);
            setError(null);

            // CORRIGIDO: removido /api da rota
            const response = await fetch(`http://localhost:4000/produtos/${id}`); 

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Erro ao buscar produto: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            setProductData(data);

          } catch (err) {
            setError(err.message || "Não foi possível carregar os dados do produto.");
          } finally {
            setIsLoadingProduct(false);
          }
        };
        fetchProduct();
      }
    }
  }, [router, id]);

  const handleEditProduct = async (formDataToSend, formError) => {
    if (formError) {
      setError(formError);
      return;
    }
    setError(null);
    setIsSavingForm(true);

    try {
      const response = await fetch(`http://localhost:4000/produtos/${id}`, {
        method: 'PUT',
        body: formDataToSend,
        credentials: 'include',      
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Falha ao atualizar produto: ${response.statusText}`);
      }

      const result = await response.json();
      alert("Produto atualizado com sucesso!");
      router.push(`/empresa/${slug}/produtos`);

    } catch (err) {
      setError(err.message || "Erro ao atualizar o produto.");
    } finally {
      setIsSavingForm(false);
    }
  };

  if (isAuthChecking || isLoadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-[#3681B6]">Carregando conteúdo do produto...</p>
      </div>
    );
  }

  if (error && !productData) {
    return (
      <div className="text-center p-8 text-xl text-red-700">
        Erro ao carregar o produto: {error}
        <p className="mt-4">
          Por favor, <button onClick={() => router.reload()} className="text-[#3681B6] hover:underline">tente recarregar a página</button>.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-lg p-5 w-full sm:max-w-xl">
        <div className="flex justify-between">
          <div className="h-12 mb-1 object-contain">
            <Image src="/logo.png" width={80} height={70} alt="Logo da Marca" />
          </div>
          {/* <LogoutButton /> -- Esta linha foi removida */}
        </div>

        <ProductFormulario
          title="Editar Produto"
          initialData={productData || {}}
          onSubmit={handleEditProduct}
          isSaving={isSavingForm}
          error={error}
          slug={slug}
        />
      </div>
    </div>
  );
}