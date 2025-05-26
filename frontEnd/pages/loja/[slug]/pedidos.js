import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';

export default function Pedidos() {
  const router = useRouter();
  const { slug } = router.query;

  const [pedidos, setPedidos] = useState([]);
  const [corPrimaria, setCorPrimaria] = useState("#3B82F6"); // Valor padrão

  // Função para calcular contraste (opcional)
  const getContrastColor = (hexColor) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  useEffect(() => {
    if (!slug) return;

    // Buscar informações da loja para obter a corPrimaria
    async function fetchLoja() {
      try {
        const url = `http://localhost:4000/loja/slug/${slug}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao buscar loja");
        const data = await response.json();
        setCorPrimaria(data.cor_primaria || "#3B82F6");
      } catch (error) {
        console.error("Erro ao buscar loja:", error);
        setCorPrimaria("#3B82F6");
      }
    }

    // Buscar pedidos
    async function fetchPedidos() {
      try {
        const res = await fetch(`http://localhost:4000/loja/${slug}/pedidos`);
        console.log(res)
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setPedidos(data);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    }

    fetchLoja();
    fetchPedidos();
  }, [slug]);

  const traduzirStatus = (status) => {
    switch (status) {
      case '0':
      case 0:
        return 'Aguardando confirmação';
      case '1':
      case 1:
        return 'Confirmado';
      default:
        return 'Status desconhecido';
    }
  };

  if (!slug) return <p className="text-black text-center mt-10">Carregando...</p>;

  // Calcular a cor do texto com base na corPrimaria (opcional)
  const textColor = getContrastColor(corPrimaria);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Barra superior */}
      <header
        className="px-4 py-3 flex items-center justify-center shadow"
        style={{ backgroundColor: corPrimaria, color: textColor }}
      >
        <h1 className="text-xl font-bold" style={{ color: textColor }}>
          Seus pedidos em {slug}
        </h1>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 p-4 flex flex-col items-center">
        {pedidos.length === 0 ? (
          <p className="text-black text-center text-lg mt-10">Você ainda não fez pedidos.</p>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full max-w-md">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-white border border-gray-300 rounded-md p-4 w-full text-black shadow"
              >
                <p><strong>ID do pedido:</strong> {pedido.id}</p>
                <p><strong>Data:</strong> {pedido.data}</p>
                <p><strong>Total:</strong> R$ {(Number(pedido.total) || 0).toFixed(2)}</p>
                <p><strong>Status:</strong> {traduzirStatus(pedido.status)}</p>
                <p><strong>Observações:</strong> {pedido.observacoes || 'Nenhuma'}</p>

                {/* Botão Finalizar */}
                <div className="mt-4 flex justify-center">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                    style={{ backgroundColor: corPrimaria }}
                    onClick={() =>
                      router.push({
                        pathname: `/loja/${slug}/finalizarPedido`,
                        query: { pedidoId: pedido.id }, // ajuste aqui com o nome real do seu objeto
                      })
                    }
                  >
                    Finalizar
                  </button>
                </div>



              </div>
            ))}
          </div>
        )}
      </main>

      <NavBar site={slug} corPrimaria={corPrimaria} />
    </div>
  );
}