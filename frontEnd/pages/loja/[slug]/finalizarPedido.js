import { useEffect, useState } from "react";
import Image from "next/image";
import { FiEdit, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useRouter } from "next/router";
import NavBar from "@/components/NavBar";

const getImagemProduto = (caminhoImagem) => {
    if (!caminhoImagem) return null;
    if (caminhoImagem.startsWith('http')) return caminhoImagem;
    const baseUrl = 'https://cufzswdymzevdeonjgan.supabase.co/storage/v1/object/public';
    return `${baseUrl}/imagens/clientes/${encodeURIComponent(caminhoImagem)}`;
};

export default function FinalizarPedido({ empresaId }) {
    const [itensCarrinho, setItensCarrinho] = useState([]);
    const [corPrimaria, setCorPrimaria] = useState("#3B82F6");
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState(null);
    const [metodoEntrega, setMetodoEntrega] = useState("retirada");
    const [metodoPagamento, setMetodoPagamento] = useState("pix");
    const [cupom, setCupom] = useState("");
    const [aceiteTermos, setAceiteTermos] = useState(false);
    const [frete, setFrete] = useState(0);
    const [desconto, setDesconto] = useState(0);
    const [dadosCliente, setDadosCliente] = useState({
        nome: "",
        email: "",
        telefone: "",
        endereco: {}
    });
    const [enderecos, setEnderecos] = useState([]); // Estado inicial vazio
    const [enderecoEntrega, setEnderecoEntrega] = useState({
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cep: "",
        cidade: "",
        estado: ""
    });

    const [cartoes, setCartoes] = useState([]);


    const router = useRouter();
    const { slug } = router.query;
    const { pedidoId } = router.query;
    console.log("slug:", slug);
    console.log("pedidoId:", pedidoId);
    //const pedidoId = router.query.pedidoId;

    // Função toggleSection para controlar as seções expansíveis
    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    // Função para obter o ID do cliente
    const getClienteId = () => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData).id : null;
    };

    // Verifica se já existe endereço para o cliente
    const verificarEnderecoExistente = async (clienteId) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
            }
        });

        if (!response.ok) {
            console.error("Erro ao verificar endereço:", response.status);
            return false;
        }

        const data = await response.json();
        return data && data.length > 0;
    };

    // Salva o endereço do cliente
    const salvarEnderecoCliente = async (clienteId) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
            },
            body: JSON.stringify({
                rua: enderecoEntrega.rua,
                numero: enderecoEntrega.numero,
                complemento: enderecoEntrega.complemento,
                bairro: enderecoEntrega.bairro,
                cep: enderecoEntrega.cep,
                cidade: enderecoEntrega.cidade,
                estado: enderecoEntrega.estado
            })
        });

        if (!response.ok) throw new Error("Erro ao salvar endereço");
    };

    // useEffect para carregar dados (mantido da versão anterior)
    useEffect(() => {
        const { id } = router.query;

        if (!slug || !pedidoId) return;

        const fetchData = async () => {
            try {
                // Buscar dados do pedido usando o ID
                const pedidoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/${pedidoId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
                    }
                });

                const pedidoData = await pedidoResponse.json();
                console.log("Pedido recebido:", pedidoData);
                console.log("Itens do pedido:", pedidoData.itens);

                // Verifique se existe uma lista de itens no pedido
                if (pedidoData && pedidoData.itens) {
                    setItensCarrinho(pedidoData.itens);
                }

                // Buscar dados do cliente
                const clienteId = getClienteId();
                if (clienteId) {
                    const clienteResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token_cliente')}` }
                    });
                    const clienteData = await clienteResponse.json();
                    
                    const enderecoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/enderecos?clienteId=${clienteId}`);
                    if (!enderecoResponse.ok) {
                        console.warn("Falha ao buscar endereço. Status:", enderecoResponse.status);
                        return;
                    }
                    const enderecoData = await enderecoResponse.json();

                    setDadosCliente({
                        nome: clienteData.nome,
                        email: clienteData.email,
                        telefone: clienteData.telefone
                    });

                    if (enderecoData && enderecoData.length > 0) {
                        setEnderecoEntrega({
                            rua: enderecoData[0].rua,
                            numero: enderecoData[0].numero,
                            complemento: enderecoData[0].complemento || "",
                            bairro: enderecoData[0].bairro,
                            cep: enderecoData[0].cep,
                            cidade: enderecoData[0].cidade,
                            estado: enderecoData[0].estado
                        });
                    }
                }


            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            }
        };

        fetchData();
    }, [router.query]);

    // Cálculos
    const subtotal = itensCarrinho.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0);
    const total = subtotal + frete - desconto;

    // Funções de manipulação (mantidas da versão anterior)
    const handleRemoverItem = async (id) => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/carrinho/${id}`, {
                method: 'DELETE'
            });
            setItensCarrinho(itensCarrinho.filter(item => item.id !== id));
        } catch (error) {
            console.error("Erro ao remover item:", error);
        }
    };

    const handleAplicarCupom = () => {
        if (cupom === "DESCONTO10") {
            setDesconto(subtotal * 0.1);
        }
    };

    const handleFinalizarPedido = async () => {
        if (!aceiteTermos) {
            alert("Você precisa aceitar os termos e condições!");
            return;
        }

        const camposObrigatorios = ['rua', 'numero', 'bairro', 'cep', 'cidade', 'estado'];
        const enderecoCompleto = camposObrigatorios.every(
            campo => enderecoEntrega[campo]
        );

        if (!enderecoCompleto) {
            alert("Preencha todos os campos obrigatórios do endereço!");
            return;
        }

        setLoading(true);

        try {
            const clienteId = getClienteId();
            if (!clienteId) throw new Error("Usuário não autenticado");

            const enderecoExistente = await verificarEnderecoExistente(clienteId);
            if (!enderecoExistente || enderecoEditado) {
                await salvarEnderecoCliente(clienteId);
            }

            const payload = {
                metodoPagamento,
                enderecoEntrega: {
                    destinatario: dadosCliente.nome || "Cliente",
                    cep: enderecoEntrega.cep,
                    rua: enderecoEntrega.rua,
                    numero: enderecoEntrega.numero,
                    complemento: enderecoEntrega.complemento || "",
                    bairro: enderecoEntrega.bairro,
                    cidade: enderecoEntrega.cidade,
                    estado: enderecoEntrega.estado,
                    telefone: dadosCliente.telefone || ""
                },
                cupom: cupom.trim() !== "" ? cupom : null,
                clienteId
            };

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/finalizar`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
                    },
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {
                let errorMessage = "Erro ao finalizar pedido";

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.erro || errorMessage;
                } catch (e) {
                    const text = await response.text();
                    console.error("Resposta inesperada (HTML?):", text);
                }

                throw new Error(errorMessage);

                /*const errorData = await response.json();
                throw new Error(errorData.erro || "Erro ao finalizar pedido");*/
            }

            const { pedido } = await response.json();
            router.push(`/${slug}/pedido/confirmacao/${pedido.id}`);

        } catch (error) {
            console.error("Erro ao finalizar pedido:", error);
            alert(error.message.includes('Estoque insuficiente')
                ? error.message
                : "Erro ao processar pedido. Tente novamente."
            );

            if (error.message.includes('Estoque insuficiente')) {
                router.reload();
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-black">
            <header
                className="text-white px-4 py-3 shadow flex items-center justify-center"
                style={{ backgroundColor: corPrimaria }}
            >
                <h1 className="text-xl font-bold">Finalizar Pedido</h1>
            </header>

            <div className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
                {/* 1. Resumo do Pedido */}
                <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => toggleSection('resumo')}
                    >
                        <h2 className="text-lg font-bold">1. Resumo do Pedido</h2>
                        {activeSection === 'resumo' ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </div>

                    {activeSection === 'resumo' && (
                        <div className="p-4 border-t">
                            {itensCarrinho.map((item, index) => (
                                <div key={index} className="flex items-start py-4 border-b last:border-b-0">
                                    <Image
                                        src={getImagemProduto(item.produto.image)}
                                        alt={item.produto.nome}
                                        width={80}
                                        height={80}
                                        className="rounded object-cover border"
                                    />

                                    <div className="ml-4 flex-1">
                                        <div className="flex justify-between">
                                            <h3 className="font-medium">{item.produto.nome}</h3>
                                            <span className="font-bold">R$ {(item.produto.preco * item.quantidade).toFixed(2)}</span>
                                        </div>

                                        <p className="text-sm text-gray-600 mt-1">Qtd: {item.quantidade}</p>
                                        {item.variacoes && (
                                            <div className="text-sm text-gray-600">
                                                {Object.entries(item.variacoes).map(([key, value]) => (
                                                    <p key={key}>{key}: {value}</p>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex mt-2 space-x-4">
                                            <button className="flex items-center text-sm text-blue-600">
                                                <FiEdit className="mr-1" /> Editar
                                            </button>
                                            <button
                                                className="flex items-center text-sm text-red-600"
                                                onClick={() => handleRemoverItem(item.id)}
                                            >
                                                <FiTrash2 className="mr-1" /> Remover
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-between mt-4 pt-4 border-t">
                                <span className="font-bold">Subtotal:</span>
                                <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Endereço de Entrega */}
                <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => toggleSection('endereco')}
                    >
                        <h2 className="text-lg font-bold">2. Endereço de Entrega</h2>
                        {activeSection === 'endereco' ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </div>

                    {activeSection === 'endereco' && (
                        <div className="p-4 border-t">
                            <div className="space-y-4">
                                {enderecos.map(endereco => (
                                    <div key={endereco.id} className={`border rounded-lg p-4 ${endereco.principal ? "border-blue-500 bg-blue-50" : ""}`}>
                                        <div className="flex justify-between">
                                            <h3 className="font-medium">{endereco.nome} {endereco.principal && "(Principal)"}</h3>
                                            <button className="text-blue-600 text-sm">Editar</button>
                                        </div>

                                        <p className="mt-2">{endereco.destinatario}</p>
                                        <p>{endereco.rua}, {endereco.numero} {endereco.complemento && `- ${endereco.complemento}`}</p>
                                        <p>{endereco.bairro}, {endereco.cidade} - {endereco.estado}</p>
                                        <p>CEP: {endereco.cep}</p>
                                        <p>Telefone: {endereco.telefone}</p>

                                        {!endereco.principal && (
                                            <button
                                                onClick={() => setEnderecoEntrega(endereco)} // Atualiza o endereço selecionado
                                            >
                                                Usar este endereço
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <button className="w-full py-2 border-2 border-dashed rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500">
                                    + Adicionar novo endereço
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Método de Entrega */}
                <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => toggleSection('entrega')}
                    >
                        <h2 className="text-lg font-bold">3. Método de Entrega</h2>
                        {activeSection === 'entrega' ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </div>

                    {activeSection === 'entrega' && (
                        <div className="p-4 border-t">
                            <div className="space-y-3">
                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoEntrega"
                                        value="retirada"
                                        checked={metodoEntrega === "retirada"}
                                        onChange={() => setMetodoEntrega("retirada")}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Retirada na Loja</span>
                                            <span className="font-bold">Grátis</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Disponível em 1 dia útil</p>
                                    </div>
                                </label>

                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoEntrega"
                                        value="padrao"
                                        checked={metodoEntrega === "padrao"}
                                        onChange={() => {
                                            setMetodoEntrega("padrao");
                                            setFrete(15.90);
                                        }}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Entrega Padrão</span>
                                            <span className="font-bold">R$ 15,90</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Entrega em 3-5 dias úteis</p>
                                    </div>
                                </label>

                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoEntrega"
                                        value="expresso"
                                        checked={metodoEntrega === "expresso"}
                                        onChange={() => {
                                            setMetodoEntrega("expresso");
                                            setFrete(29.90);
                                        }}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Entrega Expressa</span>
                                            <span className="font-bold">R$ 29,90</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Entrega em 1-2 dias úteis</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Forma de Pagamento */}
                <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => toggleSection('pagamento')}
                    >
                        <h2 className="text-lg font-bold">4. Forma de Pagamento</h2>
                        {activeSection === 'pagamento' ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </div>

                    {activeSection === 'pagamento' && (
                        <div className="p-4 border-t">
                            <div className="space-y-4">
                                {/* Opção PIX */}
                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoPagamento"
                                        value="pix"
                                        checked={metodoPagamento === "pix"}
                                        onChange={() => setMetodoPagamento("pix")}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">PIX</span>
                                            <span className="text-green-600">5% de desconto</span>
                                        </div>
                                        {metodoPagamento === "pix" && (
                                            <div className="mt-3 bg-gray-100 p-4 rounded-lg text-center">
                                                <p className="font-medium">Chave PIX:</p>
                                                <p className="text-sm text-gray-600">123.456.789-00</p>
                                                <div className="mt-2 p-2 bg-white inline-block">
                                                    {/* QR Code placeholder */}
                                                    <div className="w-32 h-32 bg-gray-300 flex items-center justify-center">
                                                        <span className="text-xs">QR Code</span>
                                                    </div>
                                                </div>
                                                <p className="mt-2 text-sm">Pague com PIX e ganhe 5% de desconto</p>
                                            </div>
                                        )}
                                    </div>
                                </label>

                                {/* Opção Cartão de Crédito */}
                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoPagamento"
                                        value="cartao"
                                        checked={metodoPagamento === "cartao"}
                                        onChange={() => setMetodoPagamento("cartao")}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Cartão de Crédito</span>
                                        </div>

                                        {metodoPagamento === "cartao" && (
                                            <div className="mt-3 space-y-3">
                                                {cartoes.length > 0 && (
                                                    <div className="space-y-2">
                                                        {cartoes.map(cartao => (
                                                            <label key={cartao.id} className="flex items-center p-2 border rounded">
                                                                <input
                                                                    type="radio"
                                                                    name="cartaoSelecionado"
                                                                    className="mr-2"
                                                                />
                                                                <span>**** **** **** {cartao.ultimosDigitos} - {cartao.bandeira}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}

                                                <button
                                                    className="text-blue-600 text-sm"
                                                    onClick={() => router.push(`/${slug}/adicionar-cartao`)}
                                                >
                                                    {cartoes.length > 0 ? "Adicionar outro cartão" : "Adicionar cartão"}
                                                </button>

                                                <div className="text-xs text-gray-500 mt-2">
                                                    <p>Seus dados são criptografados e protegidos com segurança.</p>
                                                    <div className="flex space-x-2 mt-1">
                                                        <span>🔒</span>
                                                        <span>SSL</span>
                                                        <span>3D Secure</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </label>

                                {/* Opção Boleto */}
                                <label className="flex items-start p-3 border rounded-lg cursor-pointer">
                                    <input
                                        type="radio"
                                        name="metodoPagamento"
                                        value="boleto"
                                        checked={metodoPagamento === "boleto"}
                                        onChange={() => setMetodoPagamento("boleto")}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="font-medium">Boleto Bancário</span>
                                        </div>
                                        {metodoPagamento === "boleto" && (
                                            <p className="mt-2 text-sm text-gray-600">O boleto será gerado após a confirmação do pedido.</p>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* 5. Cupons e Promoções */}
                <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
                    <div
                        className="flex justify-between items-center p-4 cursor-pointer"
                        onClick={() => toggleSection('cupons')}
                    >
                        <h2 className="text-lg font-bold">5. Cupons e Promoções</h2>
                        {activeSection === 'cupons' ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                    </div>

                    {activeSection === 'cupons' && (
                        <div className="p-4 border-t">
                            <div className="flex">
                                <input
                                    type="text"
                                    placeholder="Digite seu cupom"
                                    value={cupom}
                                    onChange={(e) => setCupom(e.target.value)}
                                    className="flex-1 border rounded-l-lg p-2"
                                />
                                <button
                                    onClick={handleAplicarCupom}
                                    className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700"
                                    style={{ backgroundColor: corPrimaria }}
                                >
                                    Aplicar
                                </button>
                            </div>

                            {desconto > 0 && (
                                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                    <p className="text-green-700 font-medium">Cupom aplicado com sucesso!</p>
                                    <p className="text-sm">Desconto de R$ {desconto.toFixed(2)}</p>
                                </div>
                            )}

                            <div className="mt-4">
                                <h4 className="font-medium">Promoções ativas:</h4>
                                <ul className="mt-2 space-y-2 text-sm">
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span>Frete grátis para compras acima de R$ 200,00</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 mr-2">✓</span>
                                        <span>5% de desconto no PIX</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* 6. Resumo Final */}
                <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
                    <h2 className="text-lg font-bold mb-4">Resumo do Pedido</h2>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Subtotal ({itensCarrinho.length} itens):</span>
                            <span>R$ {subtotal.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Frete:</span>
                            <span>{frete === 0 ? "Grátis" : `R$ ${frete.toFixed(2)}`}</span>
                        </div>

                        {desconto > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Desconto:</span>
                                <span>- R$ {desconto.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="border-t pt-3 mt-2 flex justify-between font-bold text-lg">
                            <span>Total:</span>
                            <span>R$ {total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* 7. Dados para Contato */}
                <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
                    <h2 className="text-lg font-bold mb-3">Dados para Contato</h2>

                    <div className="space-y-2 text-sm">
                        <p><span className="font-medium">E-mail:</span> {dadosCliente.email}</p>
                        <p><span className="font-medium">Telefone:</span> {dadosCliente.telefone}</p>
                    </div>

                    <label className="flex items-center mt-4">
                        <input
                            type="checkbox"
                            className="mr-2"
                            defaultChecked
                        />
                        <span className="text-sm">Receber atualizações por e-mail</span>
                    </label>

                    <label className="flex items-center mt-2">
                        <input
                            type="checkbox"
                            className="mr-2"
                            defaultChecked
                        />
                        <span className="text-sm">Receber atualizações por WhatsApp</span>
                    </label>
                </div>

                {/* 8. Termos e Condições */}
                <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
                    <label className="flex items-start">
                        <input
                            type="checkbox"
                            checked={aceiteTermos}
                            onChange={() => setAceiteTermos(!aceiteTermos)}
                            className="mt-1 mr-2"
                        />
                        <span className="text-sm">
                            Li e aceito os <a href="#" className="text-blue-600">Termos de Uso</a> e <a href="#" className="text-blue-600">Política de Privacidade</a>.
                            Também concordo com a <a href="#" className="text-blue-600">Política de Trocas e Devoluções</a>.
                        </span>
                    </label>
                </div>

                {/* 9. Confirmação do Pedido */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-16">
                    <div className="text-center mb-4 text-sm text-gray-600">
                        <p>🔒 Ambiente seguro com criptografia SSL</p>
                    </div>

                    <button
                        onClick={handleFinalizarPedido}
                        disabled={loading || !aceiteTermos}
                        className={`w-full py-3 rounded-lg text-white font-bold flex items-center justify-center ${(!aceiteTermos || loading) ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}`}
                        style={{ backgroundColor: corPrimaria }}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processando...
                            </>
                        ) : (
                            "Finalizar Pedido"
                        )}
                    </button>

                    <p className="text-center mt-3 text-xs text-gray-500">
                        Ao confirmar, você concorda com os termos e condições acima.
                    </p>
                </div>
            </div>

            <NavBar empresaId={empresaId} corPrimaria={corPrimaria} />
        </div>
    );
}