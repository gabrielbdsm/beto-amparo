import { useEffect, useState } from "react";
import Image from "next/image";
import { FaTrashAlt } from "react-icons/fa"; // Importando o ícone de lixo
import NavBar from "@/components/NavBar"; // Adiciona a NavBar

export default function CarrinhoCliente({ empresaId }) {
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [subtotal, setSubtotal] = useState(0);

  useEffect(() => {
    async function fetchCarrinho() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/carrinho`);
        if (!response.ok) throw new Error("Erro ao buscar carrinho");

        const data = await response.json();
        setItensCarrinho(data);

        const total = data.reduce((acc, item) => acc + item.quantidade * item.produto.preco, 0);
        setSubtotal(total);
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
      }
    }

    fetchCarrinho();
  }, []);

  const handleFinalizarCompra = () => {
    alert("Compra finalizada!"); // Substituir por lógica real
  };

  const handleRemoverItem = async (id) => {
    try {
      // Remover item localmente
      const novosItens = itensCarrinho.filter((item) => item.id !== id);
      setItensCarrinho(novosItens);

      // Atualizar o subtotal após remoção
      const novoSubtotal = novosItens.reduce((acc, item) => acc + item.quantidade * item.produto.preco, 0);
      setSubtotal(novoSubtotal);

      // Remover item no backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/carrinho/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Erro ao remover item do carrinho");

    } catch (error) {
      console.error("Erro ao remover item:", error);
    }
  };

  const getImagemProduto = (caminhoImagem) => {
    console.log("Imagem recebida:", caminhoImagem); // OK agora
    if (!caminhoImagem) return '/frontEnd/public/fallback.png';
    if (caminhoImagem.startsWith('http')) return caminhoImagem;
    const baseUrl = 'https://cufzswdymzevdeonjgan.supabase.co/storage/v1/object/public';
    return `${baseUrl}/imagens/clientes/${encodeURIComponent(caminhoImagem)}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      <header className="bg-blue-300 text-white px-4 py-3 shadow flex items-center justify-center">
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
                    onClick={() => handleRemoverItem(item.id)} // Passando o id do item
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
                className="w-full py-3 bg-blue-500 hover:bg-green-600 text-white rounded-xl mt-6"
              >
                Finalizar Compra
              </button>
            </div>
          )}
        </div>
      </div>

      <NavBar empresaId={empresaId} />
    </div>
  );
}
