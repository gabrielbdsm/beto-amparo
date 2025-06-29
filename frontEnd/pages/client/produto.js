import { useEffect, useState } from "react";
import axios from "axios";
import ExibirProduto from "@/components/ExibirProduto";
import Adicionais from "@/components/Adicionais";
import QuantidadeControl from "@/components/QuantidadeControl";
import Carrinho from "@/components/AdicionarCarrinho";
import NavBar from "@/components/NavBar";
import { Obersevacao } from "@/components/Observacao";
import Rating from "@/components/Rating"; // IMPORTANTE
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function Produto() {
    const router = useRouter();
    const { id, site } = router.query;

    const [produto, setProduto] = useState(null);
    const [adicionais, setAdicionais] = useState({});
    const [quantidade, setQuantidade] = useState(1);
    const [selecionados, setSelecionados] = useState({});
    const [corPrimaria, setCorPrimaria] = useState("#3B82F6");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [nomeAvaliador, setNomeAvaliador] = useState('');
    const [comentario, setComentario] = useState('');
    const [nota, setNota] = useState(0);
    const [avaliacoes, setAvaliacoes] = useState([]);

    const subtotal =
        (produto?.preco || 0) * quantidade +
        Object.values(selecionados).reduce(
            (acc, item) => acc + item.count * item.price,
            0
        );

    useEffect(() => {
        if (!site) return;

        async function fetchEmpresa() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${site}`);
                const data = await response.json();
                setCorPrimaria(data.cor_primaria || "#3B82F6");
            } catch (error) {
                console.error("Erro ao buscar empresa:", error);
            }
        }
        fetchEmpresa();
    }, [site]);

    useEffect(() => {
        if (!router.isReady || !id) return;

        async function fetchProduto() {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produto/${id}`);
                const data = await response.json();

                if (!response.ok || !data) {
                    setError("Produto não encontrado.");
                    setProduto(null);
                } else {
                    setProduto(data);
                    setAdicionais(data.itens?.adicionais || {});
                }
            } catch (err) {
                setError("Erro ao carregar produto.");
                setProduto(null);
            } finally {
                setLoading(false);
            }
        }

        async function fetchAvaliacoes() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produto/${id}/avaliacoes`);
                const data = await response.json();
                console.log("Avaliações recebidas:", data);

                if (Array.isArray(data)) {
                    setAvaliacoes(data);
                } else if (Array.isArray(data.avaliacoes)) {
                    setAvaliacoes(data.avaliacoes);
                } else {
                    setAvaliacoes([]);
                    console.warn("Formato inesperado de avaliações:", data);
                }
            } catch (err) {
                console.error("Erro ao buscar avaliações:", err);
            }
        }

        fetchProduto();
        fetchAvaliacoes();
    }, [id, router.isReady]);

    const toggleAdicional = (name, price, type) => {
        setSelecionados((prev) => {
            const count = prev[name]?.count || 0;
            const newCount = type === "+" ? count + 1 : Math.max(count - 1, 0);
            return {
                ...prev,
                [name]: { count: newCount, price },
            };
        });
    };

    const handleAddToCart = async () => {
        try {
            if (!produto || !produto.id_loja) {
                toast.error("Informações do produto incompletas.");
                return;
            }

            const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${site}/carrinho`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    produtoId: produto.id,
                    quantidade,
                    lojaId: produto.id_loja
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.mensagem || 'Erro');
            toast.success(data.mensagem || 'Adicionado com sucesso!');
        } catch (error) {
            toast.error('Erro ao adicionar ao carrinho');
        }
    };

    const handleEnviarAvaliacao = async () => {
        if (!nomeAvaliador.trim() || nota === 0) {
            toast.error("Informe o nome e selecione uma nota.");
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produto/${id}/avaliacao`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: nomeAvaliador,
                    rating: nota,
                    comentario
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro');

            toast.success("Avaliação enviada!");
            setNomeAvaliador('');
            setNota(0);
            setComentario('');

            setAvaliacoes(prev => [...prev, data.avaliacao]); // Atualiza a lista
        } catch (err) {
            toast.error("Erro ao enviar avaliação.");
        }
    };

    if (loading) return <div className="p-4 text-center">Carregando...</div>;
    if (error) return <div className="p-4 text-center text-red-600">Erro: {error}</div>;
    if (!produto) return <div className="p-4 text-center">Produto não disponível.</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-6">
            <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl flex flex-col md:flex-row overflow-hidden">
                <div className="flex-1 p-6 space-y-6 text-gray-800">
                    <ExibirProduto produto={produto} corPrimaria={corPrimaria} />

                    <QuantidadeControl
                        produto={produto}
                        quantidade={quantidade}
                        setQuantidade={setQuantidade}
                        corPrimaria={corPrimaria}
                    />

                    <Obersevacao produto={produto} />

                    {/* Avaliação Formulário */}
                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Avalie este produto</h3>

                        <input
                            type="text"
                            value={nomeAvaliador}
                            onChange={(e) => setNomeAvaliador(e.target.value)}
                            placeholder="Seu nome"
                            className="w-full p-2 mb-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <Rating editable rating={nota} onRatingChange={setNota} />

                        <textarea
                            value={comentario}
                            onChange={(e) => setComentario(e.target.value)}
                            placeholder="Escreva seu comentário (opcional)"
                            rows={3}
                            className="w-full p-2 mt-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <button
                            onClick={handleEnviarAvaliacao}
                            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        >
                            Enviar Avaliação
                        </button>
                    </div>

                    {/* Avaliações exibidas */}
                    <div className="pt-6 border-t border-gray-200">
                        <h4 className="text-md font-semibold text-gray-700 mb-2">Avaliações de outros clientes:</h4>
                        {avaliacoes.length === 0 && <p className="text-sm text-gray-500">Nenhuma avaliação ainda.</p>}
                        <ul className="space-y-4">
                            {avaliacoes.map((av) => (
                                <li key={av.id} className="border p-3 rounded-md bg-gray-50">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold">{av.nome}</span>
                                        <span className="text-sm text-gray-400">{new Date(av.data).toLocaleDateString()}</span>
                                    </div>
                                    <Rating rating={av.rating} />
                                    {av.comentario && (
                                        <p className="text-sm text-gray-700 mt-1">{av.comentario}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="flex-1 bg-gray-100 text-gray-800 p-6 space-y-6 border-t md:border-t-0 md:border-l border-gray-200">
                    <Adicionais
                        adicionais={adicionais}
                        selecionados={selecionados}
                        toggleAdicional={toggleAdicional}
                        corPrimaria={corPrimaria}
                    />

                    <Carrinho subtotal={subtotal} handleAddToCart={handleAddToCart} />
                </div>
            </div>

            <div className="w-full max-w-5xl mt-6">
                <NavBar site={site} corPrimaria={corPrimaria} />
            </div>
        </div>
    );
}
