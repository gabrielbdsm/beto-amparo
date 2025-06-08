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

export async function getServerSideProps(context) {
    const { slug, pedidoId } = context.query;

    if (!slug || !pedidoId) {
        return {
            notFound: true,
        };
    }

    return {
        props: {},
    };
}

export default function FinalizarPedido({ empresaId, initialData }) {
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
    const [pedidoFinalizado, setPedidoFinalizado] = useState(false);
    const [pedidoInfo, setPedidoInfo] = useState(null); // guardar dados que vão para o comprovante
    const [dadosCliente, setDadosCliente] = useState({
        nome: "",
        email: "",
        telefone: "",
        endereco: {}
    });
    const [enderecos, setEnderecos] = useState([]);
    const [enderecoEntrega, setEnderecoEntrega] = useState({
        rua: "",
        numero: "",
        complemento: "",
        bairro: "",
        cep: "",
        cidade: "",
        estado: ""
    });
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [novoEndereco, setNovoEndereco] = useState({
        cep: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        complemento: '',
        destinatario: ''
    });
    const [enderecoEditado, setEnderecoEditado] = useState(false);
    const [cartoes, setCartoes] = useState([]);

    const router = useRouter();
    const { slug, pedidoId } = router.query;

    const toggleSection = (section) => {
        setActiveSection(activeSection === section ? null : section);
    };

    const getClienteId = () => {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData).id : null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNovoEndereco((prev) => ({ ...prev, [name]: value }));
    };

    const buscarCEP = async (cep) => {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (!data.erro) {
                setNovoEndereco(prev => ({
                    ...prev,
                    rua: data.logradouro || '',
                    bairro: data.bairro || '',
                    cidade: data.localidade || '',
                    estado: data.uf || '',
                    complemento: data.complemento || ''
                }));
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
        }
    };

    const validarEndereco = () => {
        const camposObrigatorios = ['rua', 'numero', 'bairro', 'cep', 'cidade', 'estado'];
        return camposObrigatorios.every(campo => novoEndereco[campo]);
    };

    const salvarEnderecoCliente = async (clienteId) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
                },
                body: JSON.stringify({
                    ...novoEndereco,
                    destinatario: dadosCliente.nome || "Cliente"
                })
            });
            console.log(response)
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Erro ao salvar endereço");
            }

            return await response.json();
        } catch (error) {
            console.error("Erro detalhado:", error);
            throw error;
        }
    };

    const handleSalvarEndereco = async () => {
        if (!validarEndereco()) {
            alert("Preencha todos os campos obrigatórios do endereço!");
            return;
        }

        try {
            const clienteId = getClienteId();
            if (!clienteId) {
                alert("Por favor, faça login para salvar endereços");
                return;
            }

            await salvarEnderecoCliente(clienteId);
            setMostrarFormulario(false);
            setEnderecoEditado(true);
            alert("Endereço salvo com sucesso!");

            const enderecoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
                }
            });

            const enderecoData = await enderecoResponse.json();

            if (enderecoData && enderecoData.length > 0) {
                setEnderecoEntrega(enderecoData[0]);
            }
        } catch (error) {
            console.error("Erro ao salvar endereço:", error);
            alert("Erro ao salvar endereço: " + error.message);
        }
    };

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

    useEffect(() => {
        const fetchData = async () => {
            console.log('Status recebido da API:', pedidoId.status);
            try {
                if (!slug || !pedidoId) return;

                // Buscar dados do pedido
                const pedidoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/${slug}/pedidos/${pedidoId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
                    }
                });
                const pedidoData = await pedidoResponse.json();

                if (pedidoData && pedidoData.itens) {
                    setItensCarrinho(pedidoData.itens);
                }

                const clienteId = getClienteId();

                if (clienteId) {
                    const clienteResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token_cliente')}` }
                    });
                    const clienteData = await clienteResponse.json();

                    const enderecoResponse = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/clientes/${clienteId}/endereco`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token_cliente')}`
                        }
                    });

                    const enderecoData = await enderecoResponse.json();

                    setDadosCliente({
                        nome: clienteData.nome,
                        email: clienteData.email,
                        telefone: clienteData.telefone
                    });

                    if (enderecoData) {
                        console.log(enderecoData)
                        setEnderecoEntrega([enderecoData]);
                        setEnderecos([enderecoData]);
                    }

                }
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            }
        };

        fetchData();
    }, [slug, pedidoId, mostrarFormulario, pedidoId.status]);

    const subtotal = itensCarrinho.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0);
    const total = subtotal + frete - desconto;

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
            alert("Cupom aplicado com sucesso!");
        } else {
            alert("Cupom inválido!");
        }
    };

    const handleFinalizarPedido = async () => {
        if (!aceiteTermos) {
            alert("Você precisa aceitar os termos e condições!");
            return;
        }

        setLoading(true);

        try {
            const clienteId = getClienteId();
            if (!clienteId) throw new Error("Usuário não autenticado");

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
                },
                cupom: cupom.trim() !== "" ? cupom : null,
                clienteId,
                itens: itensCarrinho
            };

            console.log("Payload enviado para finalizar pedido:", payload);

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

            // Leia o corpo da resposta apenas uma vez
            const responseText = await response.text();

            if (response.ok) {
                const pedidoConfirmado = JSON.parse(responseText); // salva os dados do pedido
                setPedidoFinalizado(true);
                setPedidoInfo(pedidoConfirmado); // dados úteis p/ comprovante
                return;
            }

            if (!response.ok) {
                let errorMessage = "Erro ao finalizar pedido";
                try {
                    const errorData = JSON.parse(responseText); // Tente analisar como JSON
                    errorMessage = errorData.erro || errorMessage;
                } catch (e) {
                    console.error("Resposta inesperada ou não JSON:", responseText);
                    // Se não for JSON, use a mensagem de erro padrão ou o texto da resposta
                    errorMessage = `Erro do servidor: ${responseText.substring(0, 100)}...`; // Limita o texto para não poluir o alerta
                }
                throw new Error(errorMessage);
            }

            const { pedido } = JSON.parse(responseText); // Analise como JSON se a resposta for OK
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

    const handleVerComprovante = () => {
        // Redireciona para a rota dinâmica do Next.js que está em pages/comprovante/[pedidoId].js
        router.push(`/comprovante/${pedidoId}`);
    };

    const handleVoltar = () => {
        // Redireciona para a página da loja com slug dinâmico, atenção ao parâmetro 'slug'
        router.push(`/loja/${slug}`); // Aqui o 'slug' é variável dinâmica da rota loja/[slug]/pedidos.js
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
                                    console.log(endereco),
                                    <div key={endereco.id} className={`border rounded-lg p-4 ${endereco.principal ? "border-blue-500 bg-blue-50" : ""}`}>
                                        <div className="flex justify-between">
                                            <h3 className="font-medium">{endereco.nome} {endereco.principal && "(Principal)"}</h3>
                                            <button className="text-blue-600 text-sm">Editar</button>
                                        </div>

                                        <p className="mt-2">{endereco.destinatario}</p>
                                        <p>{endereco.rua}, {endereco.numero} {endereco.complemento && `- ${endereco.complemento}`}</p>
                                        <p>{endereco.bairro}, {endereco.cidade} - {endereco.estado}</p>
                                        <p>CEP: {endereco.cep}</p>


                                        {!endereco.principal && (
                                            <button
                                                onClick={() => setEnderecoEntrega(endereco)} // Atualiza o endereço selecionado
                                            >
                                                Usar este endereço
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {/* Botão que mostra o formulário */}
                                {!mostrarFormulario && (
                                    <button
                                        className="w-full py-2 border-2 border-dashed rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500"
                                        onClick={() => setMostrarFormulario(true)}
                                    >
                                        + Adicionar novo endereço
                                    </button>
                                )}
                                {/* Formulário para novo endereço */}
                                {mostrarFormulario && (
                                    <div className="space-y-2 bg-gray-50 p-4 rounded border">
                                        <input type="text" name="destinatario" placeholder="Destinatário" onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="rua" placeholder="Rua" onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="numero" placeholder="Número" onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="complemento" placeholder="Complemento" onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="bairro" placeholder="Bairro" onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="cidade" placeholder="Cidade" onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="estado" placeholder="Estado" onChange={handleChange} className="w-full border p-2 rounded" />
                                        <input type="text" name="cep" placeholder="CEP" onChange={handleChange} className="w-full border p-2 rounded" />

                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setMostrarFormulario(false)} className="px-4 py-2 bg-gray-300 rounded">
                                                Cancelar
                                            </button>
                                            <button onClick={handleSalvarEndereco} className="px-4 py-2 bg-blue-500 text-white rounded">
                                                Salvar Endereço
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                            Li e aceito os <a
                                href="/termos/termos.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >Termos de Uso</a> e <a
                                href="/termos/termos.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >Política de Privacidade</a>.
                            Também concordo com a <a
                                href="/termos/politicaTrocas.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >Política de Trocas e Devoluções</a>.
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
                    {/* Botões pós-finalização */}
                    {pedidoFinalizado && (
                        <div className="mt-6 flex flex-col items-center gap-3">
                            <button
                                onClick={handleVerComprovante}
                                className="w-full md:w-auto bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-semibold"
                            >
                                Ver Comprovante
                            </button>
                            <button
                                onClick={handleVoltar}
                                className="w-full md:w-auto bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400 font-semibold"
                            >
                                Voltar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <NavBar empresaId={empresaId} corPrimaria={corPrimaria} />
        </div>
    );
}