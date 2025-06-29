// pages/loja/[slug]/pedidos.js (seu componente Pedidos.js)

import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import NavBar from '@/components/NavBar';
import CancelarPedidoModal from '@/components/CancelarPedidoModal';

// IMPORTS NECESSÁRIOS
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// NOVO IMPORT: date-fns-tz para manipulação de fuso horário
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'; // <--- IMPORTANTE


export default function Pedidos() {
    const router = useRouter();
    const { slug } = router.query;

    const [pedidos, setPedidos] = useState([]);
    const [corPrimaria, setCorPrimaria] = useState("#3B82F6"); // Valor padrão
    const [corSecundaria, setCorSecundaria] = useState("#F3F4F6"); // Valor padrão
    const [nome_fantasia, setNomeFantasia] = useState("");
    const [pedidoSelecionado, setPedidoSelecionado] = useState(null); // Corrigido para useState(null)
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

   // Fuso horário do Brasil (Palmas, que é GMT-3)
       const TIME_ZONE = 'America/Araguaina'; // Ou 'America/Araguaina' se preferir mais específico para TO
   
       // FUNÇÃO: Formatacao de Data COM FUSO HORÁRIO
       const formatarData = (dataISO) => {
           // --- ADICIONE OS CONSOLE.LOGS AQUI ---
           console.log('--- Debug de Data ---');
           console.log('1. dataISO recebida:', dataISO); // O que chega na função
       
           if (!dataISO) {
               console.log('dataISO é nula ou indefinida.');
               return 'N/A';
           }
       
           try {
               // Converte a data ISO (UTC) para o objeto Date no fuso horário desejado
               const zonedDate = toZonedTime(dataISO, TIME_ZONE);
             //  console.log('2. zonedDate (após toZonedTime):', zonedDate); // O objeto Date com o fuso horário aplicado
       
               // Formata a data e hora no fuso horário especificado
               const formattedDate = formatInTimeZone(zonedDate, TIME_ZONE, 'dd/MM/yyyy HH:mm', { locale: ptBR });
             //  console.log('3. Data formatada para exibição:', formattedDate); // O resultado final
             //  console.log('--- Fim Debug ---');
               return formattedDate;
           } catch (error) {
               console.error('Erro ao formatar data:', error);
               return 'Erro na data';
           }
       };

    // A lógica de isPedidoRecente não é mais usada para categorização principal,
    // apenas para verificar se um pedido é "novo" para uma tag específica, se houver.
    // REMOVI isPedidoRecente pois ela não é usada no código fornecido.

    const irParaFinalizar = (idCliente) => {
        router.push({
            pathname: `/loja/ben-burguer/finalizarPedido`,
            query: { clienteId: idCliente }
        });
    };

    const fetchPedidos = useCallback(async () => {
        if (!slug || !cliente) return;

        try {
            const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/cliente/${cliente.id}`;
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
    }, [slug, cliente]);

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
        if (cliente && slug) {
            fetchPedidos();
            const interval = setInterval(fetchPedidos, 15000);
            return () => clearInterval(interval);
        }
    }, [slug, cliente, fetchPedidos]);


    const traduzirStatus = (status) => {
        switch (String(status)) {
            case '-1':
                return 'Carrinho Aberto';
            case '0':
                return 'Aguardando confirmação';
            case '1':
                return 'Confirmado';
            case '2':
                return 'Em preparação';
            case '3':
                return 'Pronto para entrega';
            case '4':
                return 'Entregue';
            case '5':
                return 'Cancelado';
            default:
                return 'Status desconhecido';
        }
    };

    // Função para obter classes de estilo e mensagem com base no status
    const getPedidoCardProps = (status) => {
        let classes = "bg-white border-2 rounded-md p-4 w-full text-black shadow-lg"; // Base
        let headerClasses = "text-xl font-bold mb-2";
        let message = null;
        let messageColor = "text-gray-700";
        let icon = null;

        switch (String(status)) {
            case '0': // Aguardando confirmação (Pedido Recente)
                classes += " border-blue-500 animate-pulse-subtle";
                headerClasses += " text-blue-700";
                message = "Confirmando seu pedido! Estamos avisando a loja.";
                messageColor = "text-blue-600";
                icon = "🕒";
                break;
            case '1': // Confirmado (Pedido Recente)
                classes += " border-green-500";
                headerClasses += " text-green-700";
                message = "Seu pedido foi confirmado e será preparado em breve!";
                messageColor = "text-green-600";
                icon = "✅";
                break;
            case '2': // Em preparação (Pedido Recente)
                classes += " border-yellow-500 bg-yellow-50";
                headerClasses += " text-yellow-700";
                message = "A loja está preparando seu pedido com todo carinho!";
                messageColor = "text-yellow-600";
                icon = "🍳";
                break;
            case '3': // Pronto para entrega (Pedido Recente)
                classes += " border-indigo-500 bg-indigo-50 animate-bounce-subtle";
                headerClasses += " text-indigo-700";
                message = "Seu pedido saiu para entrega! Prepare-se para receber. 🛵";
                messageColor = "text-indigo-600";
                icon = "📦";
                break;
            case '4': // Entregue (Histórico)
                classes += ` border-gray-400 opacity-80 border-b-4 border-r-4`; // Borda cinza com bordas inferiores/direitas mais grossas
                // USO DA COR SECUNDÁRIA: Fundo sutil para histórico, ou borda adicional
                classes += ` bg-white`; // Fundo branco padrão, mas se corSecundaria for clara, pode ser aqui: `background-color: ${corSecundaria}`
                headerClasses += " text-gray-600";
                message = "Pedido entregue com sucesso! Esperamos que tenha gostado. ⭐";
                messageColor = "text-gray-500";
                icon = "🎉";
                break;
            case '5': // Cancelado (Histórico)
                classes += ` border-red-500 opacity-80 border-b-4 border-r-4`; // Borda vermelha com bordas inferiores/direitas mais grossas
                // USO DA COR SECUNDÁRIA: Fundo sutil para cancelado
                classes += ` bg-white`; // Fundo branco padrão, mas se corSecundaria for clara, pode ser aqui: `background-color: ${corSecundaria}`
                headerClasses += " text-red-700";
                message = "Este pedido foi cancelado.";
                messageColor = "text-red-600";
                icon = "❌";
                break;
            default: // Status desconhecido
                classes += " border-gray-300 opacity-90";
                headerClasses += " text-gray-700";
                message = "Verifique o status do seu pedido.";
                messageColor = "text-gray-600";
                icon = "❓";
        }
        return { classes, headerClasses, message, messageColor, icon };
    };


    const abrirModalDetalhes = async (pedido) => {
        try {
            // Ajustar para usar process.env.NEXT_PUBLIC_EMPRESA_API
            const res = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/pedidos/${pedido.id}/itens`);
            const itens = await res.json();
            setPedidoDetalhes({ ...pedido, itens });
            setShowDetalhes(true);
        } catch (err) {
            console.error("Erro ao buscar detalhes do pedido:", err);
            alert("Erro ao buscar detalhes do pedido."); // Mantenha alert ou substitua por toast no lado do cliente
        }
    };

    const abrirModalCancelamento = (pedido) => {
        setPedidoSelecionado(pedido);
        setShowModal(true);
    };

    if (!slug || !cliente) return <p className="text-black text-center mt-10">Carregando...</p>;

    const textColor = getContrastColor(corPrimaria);

    // LÓGICA DE SEPARAÇÃO POR STATUS DE CONCLUÍDO (NÃO POR TEMPO)
    const pedidosRecentes = pedidos.filter(pedido =>
        parseInt(pedido.status) < 4 // Status 0, 1, 2, 3 (Aguardando, Confirmado, Em Preparação, Pronto para Entrega)
    ).sort((a, b) => new Date(b.data) - new Date(a.data)); // Ordena os mais recentes primeiro

    const historicoPedidos = pedidos.filter(pedido =>
        parseInt(pedido.status) >= 4 // Status 4 (Entregue), 5 (Cancelado)
    ).sort((a, b) => new Date(b.data) - new Date(a.data)); // Ordena os mais recentes primeiro entre os históricos


    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <header
                className="px-4 py-3 flex items-center justify-center shadow"
                style={{ backgroundColor: corPrimaria, color: textColor }}
            >
                <h1 className="text-xl font-bold" style={{ color: textColor }}>
                    Seus pedidos em {nome_fantasia || slug}
                </h1>
            </header>

            <main className="flex-1 p-4 pb-28 flex flex-col items-center">
                {pedidos.length === 0 ? (
                    <p className="text-black text-center text-lg mt-10">Você ainda não fez pedidos.</p>
                ) : (
                    <div className="w-full max-w-4xl">
                        {/* SEÇÃO: PEDIDOS RECENTES (Ativos/Em Andamento) */}
                        {pedidosRecentes.length > 0 && (
                            <>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Meus Pedidos Ativos</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {pedidosRecentes.map((pedido) => {
                                        const { classes, headerClasses, message, messageColor, icon } = getPedidoCardProps(pedido.status);
                                        return (
                                            <div
                                                key={pedido.id}
                                                className={classes}
                                            >
                                                <h3 className={`text-lg mb-2 flex items-center gap-2 ${headerClasses}`}>
                                                    {icon && <span className="text-xl">{icon}</span>}
                                                    Status do Pedido: {traduzirStatus(pedido.status)}
                                                </h3>
                                                {message && <p className={`font-semibold mb-3 ${messageColor}`}>{message}</p>}
                                                <hr className="border-gray-200 mb-3" />

                                                <p><strong>ID do pedido:</strong> {pedido.id}</p>
                                                <p><strong>Data:</strong> {formatarData(pedido.data)}</p>
                                                <p><strong>Total:</strong> R$ {(Number(pedido.total) || 0).toFixed(2)}</p>
                                                <p><strong>Observações:</strong> {pedido.observacoes || 'Nenhuma'}</p>

                                                <div className="mt-4 flex justify-around gap-2">
                                                    <button
                                                        onClick={() => abrirModalDetalhes(pedido)}
                                                        className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 border flex-1 cursor-pointer"
                                                        style={{
                                                            backgroundColor: corPrimaria,
                                                            color: getContrastColor(corPrimaria),
                                                            borderColor: corPrimaria
                                                        }}
                                                    >
                                                        Detalhes do pedido
                                                    </button>
                                                    {String(pedido.status) === '0' && (
                                                        <button
                                                            onClick={() => abrirModalCancelamento(pedido)}
                                                            className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 border bg-red-500 text-white flex-1 cursor-pointer"
                                                        >
                                                            Cancelar pedido
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* SEÇÃO: HISTÓRICO DE PEDIDOS (Concluídos/Cancelados) */}
                        {historicoPedidos.length > 0 && (
                            <>
                                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Histórico de Pedidos</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {historicoPedidos.map((pedido) => {
                                        const { classes, headerClasses, message, messageColor, icon } = getPedidoCardProps(pedido.status);
                                        return (
                                            <div
                                                key={pedido.id}
                                                className={classes}
                                            >
                                                <h3 className={`text-lg mb-2 flex items-center gap-2 ${headerClasses}`}>
                                                    {icon && <span className="text-xl">{icon}</span>}
                                                    Status do Pedido: {traduzirStatus(pedido.status)}
                                                </h3>
                                                {message && <p className={`font-semibold mb-3 ${messageColor}`}>{message}</p>}
                                                <hr className="border-gray-200 mb-3" />

                                                <p><strong>ID do pedido:</strong> {pedido.id}</p>
                                                <p><strong>Data:</strong> {formatarData(pedido.data)}</p>
                                                <p><strong>Total:</strong> R$ {(Number(pedido.total) || 0).toFixed(2)}</p>
                                                <p><strong>Observações:</strong> {pedido.observacoes || 'Nenhuma'}</p>

                                                <div className="mt-4 flex justify-around gap-2">
                                                    <button
                                                        onClick={() => abrirModalDetalhes(pedido)}
                                                        className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 border flex-1 cursor-pointer"
                                                        style={{
                                                            backgroundColor: corPrimaria,
                                                            color: getContrastColor(corPrimaria),
                                                            borderColor: corPrimaria
                                                        }}
                                                    >
                                                        Detalhes do pedido
                                                    </button>
                                                    {/* Botão Cancelar Pedido não aparece mais no histórico */}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {showModal && (
                    <CancelarPedidoModal
                        pedidoId={pedidoSelecionado.id}
                        clienteId={pedidoSelecionado.id_cliente}
                        onClose={() => {
                            setShowModal(false);
                            fetchPedidos();
                        }}
                    />
                )}
                {showDetalhes && pedidoDetalhes && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50">
                        <div className="bg-white p-4 rounded-md shadow max-w-md w-full text-black">
                            <div className="flex flex-col items-center justify-center">
                                <h2 className="text-lg font-bold mb-2">Detalhes do Pedido</h2>
                                <div>
                                    <p><strong>ID:</strong> {pedidoDetalhes.id}</p>
                                    <p><strong>Data:</strong> {formatarData(pedidoDetalhes.data)}</p>
                                    <p><strong>Status:</strong> {traduzirStatus(pedidoDetalhes.status)}</p>
                                    <p><strong>Desconto:</strong> R$ {(Number(pedidoDetalhes.desconto) || 0).toFixed(2)}</p>
                                    <p><strong>Total:</strong> {Number(pedidoDetalhes.total).toFixed(2)}</p>

                                    <h3 className="mt-2 font-semibold">Itens:</h3>
                                    <ul className="list-disc list-inside">
                                        {pedidoDetalhes.itens?.map((item, idx) => (
                                            <li key={item.id}>
                                                {item.nome_produto || item.produto?.nome} - {item.quantidade}x R$ {(Number(item.preco_unitario) || 0).toFixed(2)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <button
                                    onClick={() => setShowDetalhes(false)}
                                    className="mt-4 px-4 py-2 bg-gray-300 rounded-md cursor-pointer"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            <NavBar site={slug} corPrimaria={corPrimaria} />
        </div>
    );
}