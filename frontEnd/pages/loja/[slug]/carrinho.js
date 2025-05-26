// C:\Users\Dallyla\OneDrive\Área de Trabalho\beto-amparo\beto-amparo\frontEnd\pages\client\carrinho.js
import { useEffect, useState } from "react";
import Image from "next/image";
import { FaTrashAlt } from "react-icons/fa";
import NavBar from "@/components/NavBar";
import { useRouter } from "next/router";
//import FinalizarPedido from "./finalizarPedido";
import { useAuthCliente } from '../../hooks/useAuthCliente';

export default function CarrinhoCliente({ empresaId }) {
  const { autenticado, cliente } = useAuthCliente();
  const router = useRouter();
  const { slug } = router.query;

  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [corPrimaria, setCorPrimaria] = useState("#3B82F6"); // Valor padrão
  const [lojaId, setLojaId] = useState(null);

  useEffect(() => {
    if (!autenticado || !slug) return;

    console.log('Cliente logado:', cliente?.id, cliente?.nome);

    const fetchData = async () => {
      try {
        setCarregando(true);

        // Buscar dados da loja
        const lojaResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${slug}`);
        if (!lojaResponse.ok) throw new Error("Erro ao buscar loja");
        const lojaData = await lojaResponse.json();
        setCorPrimaria(lojaData.cor_primaria || "#3B82F6");
        setLojaId(lojaData.id);

        // Buscar carrinho
        const carrinhoResponse = await fetch(
          `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/carrinho`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
            }
          }
        );

        if (!carrinhoResponse.ok) throw new Error("Erro ao buscar carrinho");
        const carrinhoData = await carrinhoResponse.json();

        setItensCarrinho(carrinhoData);
        setSubtotal(carrinhoData.reduce((acc, item) => acc + item.quantidade * item.produto.preco, 0));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setCarregando(false);
      }
    };
    // Buscar a corPrimaria da loja
    async function fetchLoja() {
      try {
        const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${slug}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar loja");
        const data = await response.json();
        setCorPrimaria(data.cor_primaria || "#3B82F6"); // Atualiza com a cor da API ou usa o fallback
        setLojaId(data.id);
      } catch (error) {
        console.error("Erro ao buscar loja:", error);
        setCorPrimaria("#3B82F6"); // Fallback em caso de erro
      }
    }

    // Buscar itens do carrinho
    async function fetchCarrinho() {
      try {
        // CORREÇÃO AQUI: Adicione '/loja/' ao caminho da API
        const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/carrinho`;
        console.log("Buscando carrinho em:", url);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar carrinho");
        const data = await response.json();
        console.log("Carrinho carregado:", data);
        setItensCarrinho(data);
        const total = data.reduce((acc, item) => acc + item.quantidade * item.produto.preco, 0);
        setSubtotal(total);
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
      }
    }

    fetchLoja();
    fetchCarrinho();
  }, [slug, autenticado]);

  if (!autenticado) {
    return <div className="flex justify-center items-center h-screen">
      <p>Redirecionando para login...</p>
    </div>;
  }

  const getLocalStorageSafe = (key) => {
    try {
      const value = localStorage.getItem(key);
      if (!value || value === "undefined" || value === "null") return null;
      return JSON.parse(value);
    } catch (e) {
      console.error(`Erro ao ler ${key} do localStorage:`, e);
      return null;
    }
  };


  const handleFinalizarCompra = async () => {
    try {
      // 1. Obtenção SEGURA dos dados do usuário (corrigindo o JSON.parse)
      const getLocalStorageSafe = (key) => {
        try {
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        } catch (e) {
          console.error(`Erro ao ler ${key} do localStorage:`, e);
          return null;
        }
      };

      const user = getLocalStorageSafe("user") || {};
      const token = localStorage.getItem('token_cliente');

      // 2. Verificação completa de autenticação
      if (!token || !user?.id) {
        alert("Você precisa estar logado para finalizar a compra");
        router.push(`/client/loginCliente?redirect=/loja/${slug}/carrinho`);
        return;
      }

      const id_cliente = user.id;
      const dataPedido = new Date().toLocaleDateString('pt-BR'); // DD/MM/AAAA
      const status = 0; // Pedido ainda não confirmado
      const observacoes = ""; // vazio por padrão

      const pedidoUrl = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos`;

      // 1. Criar pedido
      const pedidoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_cliente,
          id_loja: lojaId,
          data: dataPedido,
          total: subtotal,
          status,
          observacoes
        }),
      });

      const pedidoCriado = await pedidoResponse.json();
      if (!pedidoResponse.ok) {
        if (pedidoCriado?.error === 'Token inválido ou expirado') {
          localStorage.removeItem('token_cliente');
          localStorage.removeItem('user');
          alert('Sua sessão expirou. Faça login novamente.');
          router.push(`/client/loginCliente?redirect=/loja/${slug}/carrinho`);
          return;
        }

        console.error("Erro ao criar pedido:", pedidoCriado);
        throw new Error(JSON.stringify(pedidoCriado));
      }

      const pedidoId = pedidoCriado.id;

      // 2. Adicionar itens ao pedido
      for (const item of itensCarrinho) {
        const itemResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            pedido_id: pedidoId,
            produto_id: item.produto.id,
            quantidade: item.quantidade,
            preco_unitario: item.produto.preco,
          }),
        });

        const itemData = await itemResponse.json();
        if (!itemResponse.ok) {
          console.error("Erro ao adicionar item ao pedido:", itemData);
          throw new Error(itemData.erro || "Erro ao adicionar item ao pedido");
        }
      }

      // 4. Limpar carrinho
      for (const item of itensCarrinho) {
        const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/carrinho/${item.id}`, {
          method: 'DELETE',
        });

        if (!deleteResponse.ok) {
          console.error("Resposta do backend:", responseData);
          console.error(`Erro ao remover item ${item.id} do carrinho`);
        }
      }

      alert("Compra finalizada com sucesso!");
      setItensCarrinho([]);
      setSubtotal(0);
      router.push(`/loja/${slug}`);
    } catch (error) {
      console.error("Erro ao finalizar compra:", error);
      alert("Ocorreu um erro ao finalizar a compra.");
    }
  };


  async function handleRemoverItem(id) {
    try {
      const novosItens = itensCarrinho.filter((item) => item.id !== id);
      setItensCarrinho(novosItens);
      const novoSubtotal = novosItens.reduce((acc, item) => acc + item.quantidade * item.produto.preco, 0);
      setSubtotal(novoSubtotal);

      // CORREÇÃO AQUI: Adicione '/loja/' ao caminho da API
      const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/carrinho/${id}`;
      console.log("Removendo item em:", url);
      const response = await fetch(url, { method: 'DELETE' });
      if (!response.ok) throw new Error("Erro ao remover item do carrinho");
    } catch (error) {
      console.error("Erro ao remover item:", error);
    }
  }

  const getImagemProduto = (caminhoImagem) => {
    console.log("Imagem recebida:", caminhoImagem);
    if (!caminhoImagem) return '/fallback.png';
    if (caminhoImagem.startsWith('http')) return caminhoImagem;
    const baseUrl = 'https://cufzswdymzevdeonjgan.supabase.co/storage/v1/object/public';
    return `${baseUrl}/imagens/clientes/${encodeURIComponent(caminhoImagem)}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      <header
        className="text-white px-4 py-3 shadow flex items-center justify-center"
        style={{ backgroundColor: corPrimaria }}
      >
        <h1 className="text-xl font-bold">Seu Carrinho</h1>
      </header>

      <div className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {itensCarrinho.length === 0 ? (
            <p className="text-center text-gray-700 mt-10">Seu carrinho está vazio.</p>
          ) : (
            <div className="space-y-4">
              {itensCarrinho.map((item, index) => (
                <div key={index} className="flex items-center border rounded p-4 shadow-sm">
                  <Image
                    src={getImagemProduto(item.produto.image)}
                    alt={item.produto.nome}
                    width={80}
                    height={80}
                    className="rounded object-cover"
                    unoptimized
                  />
                  <div className="ml-4 flex-1">
                    <p className="text-lg font-medium text-black">{item.produto.nome}</p>
                    <p className="text-sm text-gray-800">Valor unitário: R$ {item.produto.preco.toFixed(2)}</p>
                    <p className="text-sm text-gray-800">Qtd: {item.quantidade}</p>
                  </div>
                  <div className="text-right font-semibold text-black">
                    R$ {(item.produto.preco * item.quantidade).toFixed(2)}
                  </div>
                  <button
                    onClick={() => handleRemoverItem(item.id)}
                    className="ml-4 text-red-500 hover:text-red-700"
                  >
                    <FaTrashAlt size={20} />
                  </button>
                </div>
              ))}

              <div className="flex justify-between text-lg font-bold border-t pt-4 text-black">
                <span>Total:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleFinalizarCompra}
                disabled={lojaId === null}
                className="w-full py-3 rounded-xl mt-6 text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: corPrimaria }}
              >
                Finalizar Compra
              </button>
            </div>
          )}
        </div>
      </div>

      <NavBar empresaId={empresaId} corPrimaria={corPrimaria} />
    </div>
  );
}