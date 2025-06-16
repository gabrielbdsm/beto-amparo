// C:\Users\Dallyla\OneDrive\Área de Trabalho\beto-amparo\beto-amparo\frontEnd\pages\client\carrinho.js
import { useEffect, useState } from "react";
import Image from "next/image";
import { FaTrashAlt } from "react-icons/fa";
import NavBar from "@/components/NavBar";
import { useRouter } from "next/router";

export default function CarrinhoCliente({ empresaId }) {
  const [itensCarrinho, setItensCarrinho] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [corPrimaria, setCorPrimaria] = useState("#3B82F6");
  const [lojaId, setLojaId] = useState(null);
  const [lojaAberta, setLojaAberta] = useState(true); // Novo estado para controlar se a loja está aberta

  const [totalPontosCliente, setTotalPontosCliente] = useState(0);
  const [pontosParaUsar, setPontosParaUsar] = useState(0);
  const [descontoAplicado, setDescontoAplicado] = useState(0);

  const [ativarFidelidade, setAtivarFidelidade] = useState(false);

  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    console.log("slug atual:", slug);

    if (!slug) return;

    // Buscar a corPrimaria da loja e status de abertura
    async function fetchLoja() {
      try {
        const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${slug}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar loja");
        const data = await response.json();
        setCorPrimaria(data.cor_primaria || "#3B82F6");
        setLojaId(data.id);
        setAtivarFidelidade(data.ativarFidelidade || false);
        setLojaAberta(data.aberta || false); // Assumindo que a API retorna um campo 'aberta'
      } catch (error) {
        console.error("Erro ao buscar loja:", error);
        setCorPrimaria("#3B82F6");
        setLojaAberta(false); // Em caso de erro, assume-se que a loja está fechada
      }
    }

    // Buscar itens do carrinho
    async function fetchCarrinho() {
      try {
        const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/carrinho`;
        console.log("Buscando carrinho em:", url);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar carrinho");
        const data = await response.json();
        console.log("Carrinho carregado:", data);
        console.log("Campo ativarFidelidade vindo como:", data.ativarFidelidade);
        setItensCarrinho(data);
        const total = data.reduce((acc, item) => acc + item.quantidade * item.produto.preco, 0);
        setSubtotal(total);
      } catch (error) {
        console.error("Erro ao carregar carrinho:", error);
      }
    }

    async function fetchCliente() {
      try {
        const id_cliente = 30; // depois tornar dinâmico
        const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${id_cliente}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar cliente");
        const data = await response.json();
        setTotalPontosCliente(data.total_pontos || 0);
        setPontosParaUsar(data.total_pontos || 0); // por padrão usar todos
      } catch (error) {
        console.error("Erro ao buscar cliente:", error);
      }
    }

    fetchCliente();
    fetchLoja();
    fetchCarrinho();
  }, [slug]);

  const aplicarDesconto = () => {
    const pontosDisponiveis = Math.min(pontosParaUsar, totalPontosCliente);

    // Você precisa definir como os pontos são convertidos em percentual de desconto.
    // Por exemplo, 100 pontos = 1% de desconto. Adapte essa lógica conforme a necessidade.
    const percentualDesconto = pontosDisponiveis / 100; // Exemplo: 1 ponto = 1% de desconto (ajuste conforme sua regra de negócio)
    const valorDesconto = subtotal * percentualDesconto;

    setPontosParaUsar(pontosDisponiveis);
    setDescontoAplicado(valorDesconto);
  };

  const totalFinal = Math.max(0, subtotal - descontoAplicado);

  const handleFinalizarCompra = async () => {
    if (!lojaAberta) {
      alert("A loja está fechada e não é possível finalizar a compra no momento.");
      return;
    }

    try {
      const id_cliente = 30;
      const dataPedido = new Date().toISOString().split('T')[0];
      const status = 0;
      const observacoes = "";

      // 1. Criar pedido
      const pedidoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente,
          id_loja: lojaId,
          data: dataPedido,
          total: totalFinal,
          desconto: descontoAplicado,
          status,
          observacoes
        }),
      });

      const pedidoCriado = await pedidoResponse.json();
      if (!pedidoResponse.ok) {
        console.error("Erro ao criar pedido:", pedidoCriado);
        throw new Error(pedidoCriado.erro || "Erro ao criar pedido");
      }

      const pedidoId = pedidoCriado.id;

      // 2. Adicionar itens ao pedido
      for (const item of itensCarrinho) {
        const itemResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/item`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

      // 3. Limpar carrinho
      for (const item of itensCarrinho) {
        const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/carrinho/${item.id}`, {
          method: 'DELETE',
        });

        if (!deleteResponse.ok) {
          const responseData = await deleteResponse.json(); // Tenta ler a resposta para mais detalhes
          console.error("Resposta do backend:", responseData);
          console.error(`Erro ao remover item ${item.id} do carrinho`);
        }
      }
      // 4. Atualizar pontos
      const usouPontos = descontoAplicado > 0;

      if (usouPontos) {
        // Cliente usou pontos → desconta os pontos usados
        const urlAtualizaPontos = `${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${id_cliente}/pontos`;
        await fetch(urlAtualizaPontos, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ total_pontos: totalPontosCliente - pontosParaUsar }),
        });
        console.log(urlAtualizaPontos);
      } else {
        // Cliente não usou pontos → GANHA novos pontos
        const urlGanharPontos = `${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${id_cliente}/ganhar-pontos`;
        await fetch(urlGanharPontos, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valorTotalCompra: subtotal, usouPontos: false, id_loja: lojaId }),
        });
        console.log(urlGanharPontos);
      }

      alert("Compra finalizada com sucesso!");
      setItensCarrinho([]);
      setSubtotal(0);
      router.push(`/loja/${slug}`);
    } catch (error) {
      console.error("Erro ao finalizar compra:", error);
      alert("Ocorreu um erro ao finalizar a compra. Verifique o console para mais detalhes.");
    }
  };


  async function handleRemoverItem(id) {
    try {
      const novosItens = itensCarrinho.filter((item) => item.id !== id);
      setItensCarrinho(novosItens);
      const novoSubtotal = novosItens.reduce((acc, item) => acc + item.quantidade * item.produto.preco, 0);
      setSubtotal(novoSubtotal);

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

      {/* Modal de Loja Fechada */}
      {!lojaAberta && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50"> {/* Fundo mais claro e opaco */}
          <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-sm mx-auto transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
            <h2 className="text-3xl font-extrabold text-red-600 mb-4">Loja Fechada!</h2>
            <p className="text-lg text-gray-800 mb-6 leading-relaxed">
              Desculpe, mas a loja está <span className="font-semibold">fechada no momento</span>.
              Não é possível realizar pedidos agora.
            </p>
            <p className="text-md text-gray-600 mb-6">
              Por favor, volte durante o horário de funcionamento para fazer seu pedido.
            </p>
            <button
              onClick={() => router.push(`/loja/${slug}`)}
              className="w-full px-6 py-3 rounded-lg text-white font-semibold text-lg shadow-md transition duration-300 ease-in-out hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: corPrimaria, borderColor: corPrimaria, outlineColor: corPrimaria }}
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo principal do carrinho com desfoque condicional */}
      <div className={`flex-1 flex items-center justify-center ${!lojaAberta ? 'filter blur-sm pointer-events-none' : ''}`}> {/* Adiciona desfoque e desabilita interações */}
        <div className="max-w-2xl w-full">

          {ativarFidelidade && (
            <div className="space-y-2 mb-4 p-4 border rounded-lg shadow-sm bg-gray-50">
              <label htmlFor="pontos" className="block text-sm font-medium text-gray-700">Usar pontos de fidelidade:</label>

              <input
                id="pontos"
                type="number"
                value={pontosParaUsar}
                onChange={(e) => {
                  const novoValor = parseInt(e.target.value, 10);
                  if (!isNaN(novoValor) && novoValor >= 0 && novoValor <= totalPontosCliente) {
                    setPontosParaUsar(novoValor);
                  }
                }}
                className="border p-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              <p className="text-sm text-gray-600">Você tem <span className="font-semibold">{totalPontosCliente}</span> pontos disponíveis.</p>

              <button
                onClick={aplicarDesconto}
                className="px-4 py-2 rounded-md text-white font-semibold shadow-md transition duration-300 ease-in-out hover:opacity-90"
                style={{ backgroundColor: corPrimaria }}
              >
                Aplicar Desconto
              </button>

              {descontoAplicado > 0 && (
                <div className="text-green-700 font-semibold mt-2">
                  Desconto aplicado: R$ {descontoAplicado.toFixed(2)}
                </div>
              )}
            </div>
          )}


          {itensCarrinho.length === 0 ? (
            <p className="text-center text-gray-700 mt-10">Seu carrinho está vazio.</p>
          ) : (
            <div className="space-y-4">
              {itensCarrinho.map((item, index) => (
                <div key={index} className="flex items-center border rounded-lg p-4 shadow-sm bg-white">
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
                  <button
                    onClick={() => handleRemoverItem(item.id)}
                    className="ml-4 text-red-500 hover:text-red-700 transition duration-200 ease-in-out"
                  >
                    <FaTrashAlt size={20} />
                  </button>
                </div>
              ))}

              <div className="flex justify-between font-bold border-t pt-4 text-black text-lg">
                <span>Subtotal:</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>

              {ativarFidelidade && (
                <div className="flex justify-between text-black">
                  <span>Desconto aplicado:</span>
                  <span>R$ {descontoAplicado.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-black font-bold text-xl">
                <span>Total final:</span>
                <span>R$ {totalFinal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleFinalizarCompra}
                disabled={lojaId === null || !lojaAberta || itensCarrinho.length === 0}
                className="w-full py-3 rounded-xl mt-6 text-white font-bold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: corPrimaria, cursor: (lojaId === null || !lojaAberta || itensCarrinho.length === 0) ? 'not-allowed' : 'pointer' }}
              >
                Finalizar Compra
              </button>
              {!lojaAberta && (
                <p className="text-red-500 text-center mt-2">A loja está fechada. Não é possível finalizar a compra.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <NavBar empresaId={empresaId} corPrimaria={corPrimaria} />
    </div>
  );
}