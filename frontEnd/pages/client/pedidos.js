import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react'; // Import useCallback
import NavBar from '@/components/NavBar';
import CancelarPedidoModal from '@/components/CancelarPedidoModal';
import RejectionInfo from '@/components/RejectionInfo';

export default function Pedidos() {
    const router = useRouter();
    const { slug } = router.query;

    const [pedidos, setPedidos] = useState([]);
    const [corPrimaria, setCorPrimaria] = useState("#3B82F6"); // Valor padrão
    const [corSecundaria, setCorSecundaria] = useState("#F3F4F6"); // Valor padrão
    const [nome_fantasia, setNomeFantasia] = useState("");
    const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [cliente, setCliente] = useState(null);

    const [pedidoDetalhes, setPedidoDetalhes] = useState(null);
    const [showDetalhes, setShowDetalhes] = useState(false);

    const getContrastColor = (hexColor) => {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 128 ? '#000000' : '#FFFFFF';
    };

    const formatarData = (dataISO) => {
        const data = new Date(dataISO);
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0'); // meses começam do 0
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    };

    const irParaFinalizar = (idCliente) => {
    router.push({
        pathname: `/loja/ben-burguer/finalizarPedido`,
        query: { clienteId: idCliente }
    });
    };
    // Define fetchPedidos using useCallback so it can be safely passed around
    const fetchPedidos = useCallback(async () => {
        if (!slug || !cliente) return; // Ensure slug and client are available before fetching

        try {
            const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/cliente/${cliente.id}`;
            console.log("Frontend: Chamando API de pedidos:", url);

            const res = await fetch(url, {
                method: "GET",
                credentials: 'include',
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            setPedidos(data);
        } catch (error) {
            console.error("Erro ao buscar pedidos:", error);
        }
    }, [slug, cliente]); // Dependencies for useCallback

    useEffect(() => {
        if (!slug) return;

        async function verificarLoginCliente() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/me`, {
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    setCliente(data.cliente);
                } else {
                    router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
                }
            } catch (err) {
                console.error("Erro ao verificar login", err);
                router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
            }
        }

        verificarLoginCliente();
    }, [slug, router]);

    useEffect(() => {
        // This useEffect now only fetches loja data.
        // fetchPedidos is handled by its own useCallback and triggered after client is set.
        if (!slug) return;

        async function fetchLoja() {
            try {
                const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${slug}`;
                const response = await fetch(url);
                if (!response.ok) throw new Error("Erro ao buscar loja");
                const data = await response.json();
                setCorPrimaria(data.cor_primaria || "#3B82F6");
                setCorSecundaria(data.cor_secundaria || "#F3F4F6");
                setNomeFantasia(data.nome_fantasia || slug);
            } catch (error) {
                console.error("Erro ao buscar loja:", error);
            }
        }

        fetchLoja();
        // Call fetchPedidos here, as it now has client and slug as dependencies in its useCallback
        // and will run when those change.
        if (cliente) { // Only fetch pedidos if cliente is already available
            fetchPedidos();
        }
    }, [slug, cliente, fetchPedidos]); // Add fetchPedidos to dependencies

    const traduzirStatus = (status) => {
        switch (String(status)) { // Ensure status is treated as a string for comparison
            case '0':
                return 'Aguardando confirmação';
            case '1':
                return 'Confirmado';
            case '2':
                return 'Em preparação';
            case '3':
                return 'Pronto para entrega';
            case '4':
                return 'Finalizado';
            case '5':
                return 'Cancelado';
            default:
                return 'Status desconhecido';
        }
    };

    const abrirModalDetalhes = async (pedido) => {
        try {
            // Note: The API endpoint for item details uses 'http://localhost:4000'.
            // Ensure this is correct for your production environment or use an environment variable.
            const res = await fetch(`http://localhost:4000/pedidos/${pedido.id}/itens`);
            const itens = await res.json();
            setPedidoDetalhes({ ...pedido, itens });
            setShowDetalhes(true);
        } catch (err) {
            console.error("Erro ao buscar detalhes do pedido:", err);
        }
    };

    const abrirModalCancelamento = (pedido) => {
        setPedidoSelecionado(pedido); // passa o pedido inteiro
        setShowModal(true);
    };

    if (!slug || !cliente) return <p className="text-black text-center mt-10">Carregando...</p>;

    const textColor = getContrastColor(corPrimaria);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="px-4 py-3 flex items-center justify-center shadow-md sticky top-0 bg-white z-10" style={{ backgroundColor: corPrimaria, color: textColor }}>
                <h1 className="text-xl font-semibold tracking-wide" style={{ color: textColor }}>
                    Seus pedidos em {nome_fantasia || slug}
                </h1>
            </header>

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {pedidos.length === 0 ? (
                    <div className="text-center mt-16">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                           <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Sem pedidos</h3>
                        <p className="mt-1 text-sm text-gray-500">Você ainda não fez nenhum pedido nesta loja.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-40">
                        {pedidos.map((pedido) => (
                            <div key={pedido.id} className="bg-white rounded-lg shadow-lg p-5 flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
                                {/* Seção Superior com as Informações */}
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="font-bold text-lg text-gray-800">Pedido #{pedido.id}</span>
                                        <span className="text-xs text-gray-500">{formatarData(pedido.data)}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><strong className="font-medium text-gray-800">Total:</strong> R$ {(Number(pedido.total) || 0).toFixed(2)}</p>
                                        <p><strong className="font-medium text-gray-800">Status:</strong> {traduzirStatus(pedido.status)}</p>
                                        {pedido.observacoes && <p><strong className="font-medium text-gray-800">Obs:</strong> {pedido.observacoes}</p>}
                                    </div>
                                </div>
                                
                                {/* Seção Inferior com Ações e Mensagens */}
                                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                                    {/* ÁREA DE MENSAGENS DE STATUS */}
                                    {['0', '1', '2'].includes(String(pedido.status)) && (
                                        <>
                                            {pedido.cancellation_status === 'pendente' && (
                                                <div className="p-2 w-full text-center bg-yellow-100 text-yellow-800 rounded-md text-xs font-medium">
                                                    Cancelamento solicitado...
                                                </div>
                                            )}
                                            {pedido.cancellation_status === 'rejeitado' && (
                                                <RejectionInfo rejection_reason={pedido.rejection_reason} />
                                            )}
                                        </>
                                    )}

                                    {/* ÁREA DOS BOTÕES DE AÇÃO */}
                                    <div className="flex justify-end items-center gap-2">
                                        <button onClick={() => abrirModalDetalhes(pedido)} className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                                            Detalhes
                                        </button>
                                        
                                        {['1', '2'].includes(String(pedido.status)) && !pedido.cancellation_status && (
                                            <button onClick={() => abrirModalCancelamento(pedido)} className="px-3 py-1.5 rounded-md text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors">
                                                Cancelar
                                            </button>
                                        )}
                                        
                                        {['0'].includes(String(pedido.status)) && (
                                            <button
                                                onClick={() => router.push(`/client/finalizarPedido?slug=${slug}&pedidoId=${pedido.id}&clienteId=${cliente.id}`)}
                                                className="px-3 py-1.5 rounded-md text-xs font-medium text-white transition-colors"
                                                style={{ backgroundColor: corPrimaria, color: getContrastColor(corPrimaria) }}
                                            >
                                                Finalizar Pedido
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showModal && (
                    <CancelarPedidoModal
                        pedidoId={pedidoSelecionado.id}
                        clienteId={cliente.id}
                        onClose={() => { setShowModal(false); fetchPedidos(); }}
                    />
                )}

                {showDetalhes && pedidoDetalhes && (
                    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">Detalhes do Pedido #{pedidoDetalhes.id}</h2>
                            <div className="text-sm space-y-2 text-gray-800">
                                <p><strong>Data:</strong> {formatarData(pedidoDetalhes.data)}</p>
                                <p><strong>Status:</strong> {traduzirStatus(pedidoDetalhes.status)}</p>
                                <p><strong>Total:</strong> R$ {Number(pedidoDetalhes.total).toFixed(2)}</p>
                                <h3 className="font-semibold text-base pt-2 border-t mt-3">Itens:</h3>
                                <ul className="list-disc list-inside space-y-1 pl-2">
                                    {pedidoDetalhes.itens?.map((item) => (
                                        <li key={item.id}>
                                            {item.quantidade}x {item.nome_produto} - R$ {(Number(item.preco_unitario) || 0).toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                            </div> 
                            <button onClick={() => setShowDetalhes(false)} className="mt-6 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                                Fechar
                            </button>          
                        </div>
                    </div>
                )}
            </main>

            <NavBar site={slug} corPrimaria={corPrimaria} />
        </div>
    );
}