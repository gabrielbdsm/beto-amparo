// pages/empresa/[slug]/dashboard.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image'; // Necessário para OwnerSidebar
import OwnerSidebar from '@/components/OwnerSidebar';

export default function Dashboard() {
  const router = useRouter();
  const [nomeEmpresa, setNomeEmpresa] = useState("Carregando...");
  // Estados para os pedidos
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [errorPedidos, setErrorPedidos] = useState(null);

  const { slug } = router.query; // Obtém o slug da URL (da loja)

  useEffect(() => {
    // 1. Lógica de autenticação (placeholder)
    const isAuthenticated = true;
    if (!isAuthenticated) {
      router.push('/LoginEmpresa');
      return;
    }

    if (!slug) {
        console.log("DEBUG(Dashboard): Slug da loja não disponível. Aguardando...");
        return;
    }

    // Função para buscar o nome da empresa (AParentemente funcionando)
    async function fetchNomeEmpresaParaDashboard() {
      try {
        // Esta URL é a que você confirmou que está funcionando para o nome
        const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${slug}`;
        console.log("DEBUG(Dashboard): Chamando backend para buscar nome da loja em:", url);

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
          console.error("DEBUG(Dashboard): Erro da API do backend ao buscar nome:", response.status, errorData.message);
          throw new Error(errorData.message || `Falha na requisição ao backend: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("DEBUG(Dashboard): Dados da loja recebidos para o dashboard:", data);
        setNomeEmpresa(data.nome_fantasia || "Nome não disponível");
      } catch (error) {
        console.error("DEBUG(Dashboard): Erro ao carregar nome da empresa:", error.message);
        setNomeEmpresa("Erro");
      }
    }

    // Função para buscar os pedidos (precisa de correção no backend para o 404)
    async function fetchPedidos() {
      setLoadingPedidos(true);
      setErrorPedidos(null);
      try {
        // Esta é a URL que está dando 404 Not Found no backend
        const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/pedidos/loja/${slug}`;
        console.log("DEBUG(Dashboard): Buscando pedidos em:", url);

        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
          throw new Error(errorData.message || `Falha ao buscar pedidos: ${response.status}`);
        }
        const data = await response.json();

        // Adaptação dos dados do DB para o frontend
        const adaptedPedidos = data.map(pedido => ({
            ...pedido,
            valor_total: parseFloat(pedido.total || '0'), // 'total' é VARCHAR no DB, converter para float
            data_pedido: pedido.data, // 'data' é VARCHAR no DB
            status: convertStatusIntToText(pedido.status) // 'status' é INT8 no DB, converter para texto
        }));

        setPedidos(adaptedPedidos);
      } catch (error) {
        console.error("DEBUG(Dashboard): Erro ao buscar pedidos:", error.message);
        setErrorPedidos(error.message);
      } finally {
        setLoadingPedidos(false);
      }
    }

    // Chamadas iniciais
    fetchNomeEmpresaParaDashboard(); // Busca o nome da empresa
    fetchPedidos(); // Busca os pedidos
  }, [router, slug]);


  // Funções de conversão de status (mantidas)
  const convertStatusIntToText = (statusInt) => {
    switch (statusInt) {
      case 1: return 'pendente';
      case 2: return 'em preparação';
      case 3: return 'enviado';
      case 4: return 'concluído';
      case 5: return 'cancelado';
      default: return 'desconhecido';
    }
  };

  const convertStatusTextToInt = (statusText) => {
    switch (statusText) {
      case 'pendente': return 1;
      case 'em preparação': return 2;
      case 'enviado': return 3;
      case 'concluído': return 4;
      case 'cancelado': return 5;
      default: return 0;
    }
  };


  // Função para alterar o status do pedido
  const handleStatusChange = async (pedidoId, newStatusText) => {
    const newStatusInt = convertStatusTextToInt(newStatusText); // Converte para INT8 para o DB

    try {
      const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/pedidos/${pedidoId}/status`;
      console.log(`DEBUG(Dashboard): Alterando status do pedido ${pedidoId} para ${newStatusText} (${newStatusInt})`);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatusInt }), // Envia o INT8 para o DB
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido" }));
        throw new Error(errorData.message || `Falha ao atualizar status: ${response.status}`);
      }

      // Atualiza o estado dos pedidos no frontend
      setPedidos(prevPedidos =>
        prevPedidos.map(pedido =>
          pedido.id === pedidoId ? { ...pedido, status: newStatusText } : pedido
        )
      );
      console.log(`Status do pedido ${pedidoId} atualizado para ${newStatusText} com sucesso!`);
    } catch (error) {
      console.error("DEBUG(Dashboard): Erro ao atualizar status:", error.message);
      alert(`Erro ao atualizar status: ${error.message}`);
    }
  };


  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <OwnerSidebar />

      <main className="flex-1 bg-gray-100 p-6 md:p-8">
        {/* Título: "Gerenciamento, Nome da Loja" */}
        <h1 className="text-2xl font-bold text-gray-600 mb-6 text-center">
          Gerenciamento, {nomeEmpresa}
        </h1>

        {/* --- Tabela de Pedidos --- */}
        <section className="bg-white rounded shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Pedidos Recentes</h2>

          {loadingPedidos && (
            <p className="text-center text-gray-500">Carregando pedidos...</p>
          )}
          {errorPedidos && (
            <p className="text-center text-red-500">Erro ao carregar pedidos: {errorPedidos}</p>
          )}

          {!loadingPedidos && !errorPedidos && pedidos.length === 0 && (
            <p className="text-center text-gray-500">Nenhum pedido encontrado para esta loja.</p>
          )}

          {!loadingPedidos && !errorPedidos && pedidos.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produtos
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pedido.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {pedido.cliente?.nome || 'N/A'}
                        {pedido.cliente?.telefone && ` (${pedido.cliente.telefone})`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {pedido.itens_pedido && pedido.itens_pedido.length > 0 ? (
                          pedido.itens_pedido.map(item => (
                            <div key={item.id}>
                              {item.quantidade}x {item.produto?.nome || 'Produto desconhecido'}
                            </div>
                          ))
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        R$ {typeof pedido.valor_total === 'number' ? pedido.valor_total.toFixed(2) : '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {/* Formatação da data que é VARCHAR */}
                        {pedido.data_pedido && !isNaN(new Date(pedido.data_pedido))
                          ? new Date(pedido.data_pedido).toLocaleString('pt-BR')
                          : pedido.data_pedido || 'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`
                          px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${pedido.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${pedido.status === 'em preparação' ? 'bg-blue-100 text-blue-800' : ''}
                          ${pedido.status === 'enviado' ? 'bg-purple-100 text-purple-800' : ''}
                          ${pedido.status === 'concluído' ? 'bg-green-100 text-green-800' : ''}
                          ${pedido.status === 'cancelado' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {pedido.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <select
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          value={pedido.status || ''}
                          onChange={(e) => handleStatusChange(pedido.id, e.target.value)}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="em preparação">Em Preparação</option>
                          <option value="enviado">Enviado</option>
                          <option value="concluído">Concluído</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* --- Outras Seções do Dashboard (REMOVIDAS) --- */}
      </main>
    </div>
  );
}