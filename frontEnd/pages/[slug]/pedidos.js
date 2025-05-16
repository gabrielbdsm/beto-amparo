import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import NavBar from '@/components/NavBar';

export default function Pedidos() {
  const router = useRouter();
  const { slug } = router.query;

  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    if (!slug) return;

    async function fetchPedidos() {
      try {
        const res = await fetch(`http://localhost:4000/empresa/${slug}/pedidos`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setPedidos(data);
      } catch (error) {
        console.error("Erro ao buscar pedidos:", error);
      }
    }

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Barra superior */}
      <header className="bg-blue-300 text-white px-4 py-3 flex items-center justify-center shadow">
        <h1 className="text-xl font-bold">Seus pedidos em {slug}</h1>
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
                <p><strong>Data:</strong> {new Date(pedido.data).toLocaleDateString()}</p>
                <p><strong>Total:</strong> R$ {(Number(pedido.total) || 0).toFixed(2)}</p>
                <p><strong>Status:</strong> {traduzirStatus(pedido.status)}</p>
                <p><strong>Observações:</strong> {pedido.observacoes || 'Nenhuma'}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      <NavBar site={slug} />
    </div>
  );
}
