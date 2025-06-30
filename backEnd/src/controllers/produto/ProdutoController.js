// backend/controllers/produto/ProdutoController.js

import * as produtoModel from '../../models/ProdutoModel.js';
import { validarProduto } from '../../validators/ProdutoValidators.js';
import * as ImageModel from '../../models/ImageModel.js';
import * as lojaModel from '../../models/Loja.js'; // Assumindo que este modelo existe
import supabase from '../../config/SupaBase.js';
import jwt from 'jsonwebtoken'; // Importar JWT


// --- FUNÇÃO AUXILIAR PARA OBTER EMPRESA ID DO TOKEN ---
// Esta função é útil para reutilizar a lógica de autenticação em diferentes endpoints.
async function getEmpresaIdFromToken(req) {
    const token = req.cookies?.token_empresa;

    if (!token) {
        return { error: { message: 'Token não fornecido no cookie' } };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { empresaId: decoded.id };
    } catch (err) {
        return { error: { message: 'Token inválido ou expirado' } };
    }
}

// --- FUNÇÃO criarProduto ---
export const criarProduto = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando criarProduto!');
    try {
        const {
            nome,
            categoria_id,
            preco,
            descricao,
            tamanhos,
            controlar_estoque,
            quantidade,
            id_loja, // Este é o ID da loja enviado do frontend
        } = req.body;

        const imagem = req.file; // Vem do middleware Multer

        // --- Conversão de tipos e validações iniciais ---
        const tamanhosParsed = tamanhos ? JSON.parse(tamanhos) : [];
        const controlarEstoqueBool = controlar_estoque === 'true';
        const quantidadeParsed = controlarEstoqueBool ? parseInt(quantidade, 10) || 0 : 0;
        const precoParsed = parseFloat(preco);
        const categoriaIdParsed = parseInt(categoria_id, 10);

        if (!imagem) {
            return res.status(400).json({ mensagem: "Imagem do produto é obrigatória." });
        }
        if (isNaN(categoriaIdParsed)) {
            return res.status(400).json({ mensagem: "ID da categoria inválido." });
        }
        const lojaIdNum = parseInt(id_loja, 10);
        if (isNaN(lojaIdNum)) {
            return res.status(400).json({ mensagem: "ID da loja inválido no corpo da requisição." });
        }

        const validacao = validarProduto({
            nome,
            categoria_id: categoriaIdParsed,
            preco: precoParsed,
            descricao,
            quantidade: quantidadeParsed,
        });

        if (!validacao.valido) {
            return res.status(400).json({ mensagem: validacao.erros[0] });
        }

        // --- Verificação de Autorização (usando req.Id do middleware existente) ---
        const id_empresa_autenticada = req.Id; // ID da empresa vindo do JWT através do middleware

        console.log('DEBUG: ID da loja recebido do frontend (id_loja):', id_loja, 'Tipo:', typeof id_loja);
        console.log('DEBUG: ID da empresa autenticada do JWT (id_empresa_autenticada):', id_empresa_autenticada, 'Tipo:', typeof id_empresa_autenticada);

        if (!id_empresa_autenticada) {
            return res.status(401).json({ mensagem: 'Não autorizado: ID da empresa não fornecido no token.' });
        }

        // Busca os dados completos da loja para verificar a propriedade
        console.log('DEBUG: Buscando loja pelo ID:', lojaIdNum);
        const { data: lojaDoUsuario, error: erroLojaUsuario } = await lojaModel.buscarLojaPorId(lojaIdNum);
        console.log('DEBUG: Resultado da busca da loja:', lojaDoUsuario, 'Erro:', erroLojaUsuario);

        console.log('DEBUG: ID da empresa da loja (lojaDoUsuario?.id_empresa):', lojaDoUsuario?.id_empresa, 'Tipo:', typeof lojaDoUsuario?.id_empresa);

        if (erroLojaUsuario || !lojaDoUsuario || lojaDoUsuario.id_empresa !== id_empresa_autenticada) {
            console.error('Controller: Erro de autorização ou loja não encontrada:', erroLojaUsuario || 'Loja não pertence ao usuário.');
            return res.status(403).json({ mensagem: 'Não autorizado: A loja informada não pertence à sua empresa ou não existe.' });
        }

        // --- Salvar Imagem ---
        console.log('DEBUG: Loja verificada, prosseguindo para salvar imagem...');
        const URlimagem = await ImageModel.salvarImagem(imagem.buffer, imagem.originalname, imagem.mimetype, lojaIdNum); // Assumindo que UUID é o id_loja
        console.log('DEBUG: Imagem salva. URL:', URlimagem);

        if (!URlimagem) {
            return res.status(500).json({ mensagem: 'Erro ao salvar imagem do produto no Supabase Storage.' });
        }

        // --- Inserir Produto no Banco de Dados ---
        console.log('DEBUG: Prosseguindo para inserir produto no DB...');
        const { data: novoProduto, error: inserirProdutoError } = await produtoModel.inserirProduto({
            id_loja: lojaIdNum,
            nome,
            image: URlimagem,
            categoria_id: categoriaIdParsed,
            preco: precoParsed,
            descricao,
            tamanhos: tamanhosParsed,
            controlar_estoque: controlarEstoqueBool,
            quantidade: quantidadeParsed, // <-- ATUALIZADO: Usar 'quantidade'
            ativo: true,
        });
        console.log('DEBUG: Resultado da inserção do produto:', novoProduto, 'Erro:', inserirProdutoError);

        if (inserirProdutoError) {
            console.error('Controller: Erro ao inserir produto no modelo:', inserirProdutoError);
            return res.status(500).json({ mensagem: 'Erro ao inserir produto no banco de dados.', erro: inserirProdutoError.message });
        }

        // --- Resposta de Sucesso ---
        console.log('DEBUG: Produto criado com sucesso, enviando resposta...');
        return res.status(201).json({
            mensagem: 'Produto criado com sucesso.',
            produto: novoProduto[0] // Retorna o primeiro item se for um array
        });

    } catch (erro) {
        console.error('Controller: Erro inesperado no controlador criarProduto:', erro);
        return res.status(500).json({
            mensagem: 'Erro inesperado no servidor ao criar produto.',
            erro: erro.message,
        });
    }
};

// --- FUNÇÃO getProdutos (Listar Todos os Produtos) ---
export const getProdutos = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando getProdutos!');
    try {
        const { data, error } = await produtoModel.listarProdutos();
        if (error) {
            return res.status(500).json({ mensagem: "Erro ao listar todos os produtos.", erro: error });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error('Controller: Erro no controlador getProdutos:', error);
        res.status(500).json({ mensagem: "Erro inesperado ao listar todos os produtos.", erro: error.message });
    }
};

// --- FUNÇÃO inativarProduto ---
export const inativarProduto = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando inativarProduto!');
    try {
        const { id } = req.params;

        console.log('DEBUG InativarProduto: Tentando inativar produto com ID:', id);

        if (!id) {
            console.log('DEBUG InativarProduto: ID do produto não fornecido.');
            return res.status(400).json({ mensagem: 'ID do produto não fornecido.' });
        }

        // --- AUTORIZAÇÃO: Verificar se a empresa autenticada é dona do produto ---
        const { empresaId: empresaIdDoToken, error: tokenError } = await getEmpresaIdFromToken(req);
        if (tokenError) return res.status(401).json({ error: tokenError.message });

        const { data: produtoExistente, error: produtoFetchError } = await supabase
            .from('produto')
            .select('id_loja')
            .eq('id', id)
            .single();

        if (produtoFetchError || !produtoExistente) {
            return res.status(404).json({ mensagem: 'Produto não encontrado ou ID inválido para inativação.' });
        }

        const { data: lojaDoProduto, error: lojaFetchError } = await lojaModel.buscarLojaPorId(produtoExistente.id_loja);
        if (lojaFetchError || !lojaDoProduto || lojaDoProduto.id_empresa !== empresaIdDoToken) {
            return res.status(403).json({ mensagem: 'Acesso negado: Você não tem permissão para inativar este produto.' });
        }
        // --- FIM DA AUTORIZAÇÃO ---


        const { data, error } = await supabase
            .from('produto')
            .update({ ativo: false })
            .eq('id', id);

        if (error) {
            console.error('DEBUG InativarProduto: Erro ao inativar o produto:', error);
            return res.status(500).json({
                mensagem: 'Erro ao inativar o produto.',
                erro: error.message
            });
        }

        console.log('DEBUG InativarProduto: Produto inativado com sucesso.');
        return res.status(200).json({
            mensagem: 'Produto inativado com sucesso.',
        });
    } catch (erro) {
        console.error('DEBUG InativarProduto: Erro inesperado no controlador inativarProduto:', erro);
        return res.status(500).json({
            mensagem: 'Erro inesperado ao inativar o produto.',
            erro: erro.message,
        });
    }
};

// --- FUNÇÃO ativarProduto ---
export const ativarProduto = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando ativarProduto!');
    try {
        const { id } = req.params;

        console.log('DEBUG AtivarProduto: Tentando ativar produto com ID:', id);

        if (!id) {
            console.log('DEBUG AtivarProduto: ID do produto não fornecido.');
            return res.status(400).json({ mensagem: 'ID do produto não fornecido.' });
        }

        // --- AUTORIZAÇÃO: Verificar se a empresa autenticada é dona do produto ---
        const { empresaId: empresaIdDoToken, error: tokenError } = await getEmpresaIdFromToken(req);
        if (tokenError) return res.status(401).json({ error: tokenError.message });

        const { data: produtoExistente, error: produtoFetchError } = await supabase
            .from('produto')
            .select('id_loja')
            .eq('id', id)
            .single();

        if (produtoFetchError || !produtoExistente) {
            return res.status(404).json({ mensagem: 'Produto não encontrado ou ID inválido para ativação.' });
        }

        const { data: lojaDoProduto, error: lojaFetchError } = await lojaModel.buscarLojaPorId(produtoExistente.id_loja);
        if (lojaFetchError || !lojaDoProduto || lojaDoProduto.id_empresa !== empresaIdDoToken) {
            return res.status(403).json({ mensagem: 'Acesso negado: Você não tem permissão para ativar este produto.' });
        }
        // --- FIM DA AUTORIZAÇÃO ---


        const { data, error } = await supabase
            .from('produto')
            .update({ ativo: true })
            .eq('id', id);

        if (error) {
            console.error('DEBUG AtivarProduto: Erro ao ativar o produto:', error);
            return res.status(500).json({
                mensagem: 'Erro ao ativar o produto.',
                erro: error.message
            });
        }

        console.log('DEBUG AtivarProduto: Produto ativado com sucesso.');
        return res.status(200).json({
            mensagem: 'Produto ativado com sucesso.',
        });
    } catch (erro) {
        console.error('DEBUG AtivarProduto: Erro inesperado no controlador ativarProduto:', erro);
        return res.status(500).json({
            mensagem: 'Erro inesperado ao ativar o produto.',
            erro: erro.message,
        });
    }
};

// --- FUNÇÃO buscarProdutoPorId ---
export const buscarProdutoPorId = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando buscarProdutoPorId!');
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('produto')
            .select(`*, categorias(nome, id)`)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ message: 'Produto não encontrado', details: error.message });
            }
            return res.status(500).json({ message: 'Erro ao buscar produto', details: error.message });
        }
        if (!data) {
            return res.status(404).json({ message: 'Produto não encontrado' });
        }
        res.status(200).json(data);
    } catch (err) {
        console.error('Controller: Erro no controlador buscarProdutoPorId:', err);
        res.status(500).json({ message: 'Erro interno do servidor', details: err.message });
    }
};

// --- FUNÇÃO listarProdutosPorLoja ---
export const listarProdutosPorLoja = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando listarProdutosPorLoja!');
    try {
        const { slug } = req.params;
        console.log('DEBUG: listarProdutosPorLoja - Slug recebido na API de produtos:', slug);
        const { ativo } = req.query; // 'true' ou 'false' (ou undefined)

        let idDaLojaNoDB;

        if (!slug) {
            console.warn('DEBUG: listarProdutosPorLoja - Identificador da loja (slug) não fornecido.');
            return res.status(400).json({ mensagem: "Identificador da loja (slug) não fornecido." });
        }

        const { data: lojaData, error: lojaError } = await lojaModel.buscarLojaPorSlugCompleta(slug);

        if (lojaError || !lojaData) {
            console.error("DEBUG: listarProdutosPorLoja - Erro ao buscar loja por SLUG:", lojaError);
            return res.status(404).json({ mensagem: "Loja não encontrada com o identificador fornecido." });
        }

        idDaLojaNoDB = lojaData.id;
        console.log('DEBUG: listarProdutosPorLoja - ID da loja encontrado:', idDaLojaNoDB);

        let query = supabase
            .from('produto')
            .select(`
                *,
                categorias (
                    nome,
                    id
                )
            `)
            .eq('id_loja', idDaLojaNoDB);

        // Aplica filtro de ativo/inativo se for explicitamente solicitado
        // (Ex: para a página do dono, produtos ativos ou inativos)
        if (ativo === 'false') {
            query = query.eq('ativo', false);
        } else {
            // Por padrão, ou se ativo é 'true', busca apenas produtos ativos.
            // Isso é importante para a página do cliente.
            query = query.eq('ativo', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error("DEBUG: listarProdutosPorLoja - Erro do modelo ao listar produtos:", error);
            return res.status(500).json({ mensagem: "Erro ao listar produtos.", erro: error });
        }

        // --- NOVO: Adicionar lógica para status de estoque baixo e indisponibilidade ---
        const ESTOQUE_BAIXO_LIMITE = 5; // Defina seu limite aqui

        const produtosComStatus = data.map(produto => {
            let statusEstoque = 'disponivel'; // Padrão
            let estaIndisponivel = false; // Flag para indisponibilidade na loja

            // Se o controle de estoque está ativado para este produto
            if (produto.controlar_estoque) {
                if (produto.quantidade <= 0) { // O 'quantidade' é o campo de estoque
                    statusEstoque = 'esgotado';
                    estaIndisponivel = true; // Produto esgotado -> indisponível
                } else if (produto.quantidade > 0 && produto.quantidade <= ESTOQUE_BAIXO_LIMITE) {
                    statusEstoque = 'estoque_baixo';
                }
            } else {
                // Se não controla estoque, o statusEstoque permanece 'disponivel' por padrão.
                // Não definimos estaIndisponivel aqui, pois para 'não controlado',
                // o cliente não verá como "esgotado".
            }

            // A flag `indisponivel_automatico` deve ser verdadeira se o produto está esgotado
            // OU se ele foi inativado manualmente (produto.ativo é false, mas a query já filtra por ativo:true).
            // No contexto desta função (que pode ser usada pela loja do cliente ou pelo dashboard do dono):
            // - Para o cliente, produtos inativos nem chegam aqui se a query eq('ativo', true) for usada.
            // - Para o dono, a query pode ser eq('ativo', false) e ele veria produtos inativos.
            // A `estaIndisponivel` aqui serve para marcar produtos que estão `esgotados` *automaticamente*.

            return {
                ...produto,
                status_estoque: statusEstoque, // 'disponivel', 'estoque_baixo', 'esgotado'
                indisponivel_automatico: estaIndisponivel // True se esgotado (e controla estoque)
            };
        });
        console.log('DEBUG: listarProdutosPorLoja - Produtos enviados para o frontend com status:', produtosComStatus.map(p => ({ id: p.id, nome: p.nome, qtd: p.quantidade, ativo: p.ativo, controlar_estoque: p.controlar_estoque, status_estoque: p.status_estoque, indisponivel_automatico: p.indisponivel_automatico })));

        return res.status(200).json(produtosComStatus);
    } catch (erro) {
        console.error('DEBUG: listarProdutosPorLoja - ERRO INESPERADO ao listar produtos por loja:', erro.message, erro.stack);
        return res.status(500).json({
            mensagem: "Erro inesperado ao listar produtos.",
            erro: erro.message,
        });
    }
};

// --- FUNÇÃO listarProdutosPorEmpresa ---
export const listarProdutosPorEmpresa = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando listarProdutosPorEmpresa!');
    try {
        const id_empresa = req.params.empresaId; // Recebe o id_empresa da URL

        if (!id_empresa) {
            return res.status(400).json({ mensagem: 'ID da empresa não fornecido.' });
        }

        // --- AUTORIZAÇÃO: Verificar se o id_empresa da URL corresponde ao do token ---
        const { empresaId: empresaIdDoToken, error: tokenError } = await getEmpresaIdFromToken(req);
        if (tokenError) return res.status(401).json({ error: tokenError.message });

        if (parseInt(id_empresa, 10) !== empresaIdDoToken) { // Converte para int para comparação
            return res.status(403).json({ mensagem: 'Acesso negado: Você não tem permissão para ver produtos desta empresa.' });
        }
        // --- FIM DA AUTORIZAÇÃO ---


        // Busca as lojas desta empresa
        const { data: lojas, error: lojasError } = await lojaModel.buscarLojasPorEmpresaId(empresaIdDoToken);
        if (lojasError || !lojas || lojas.length === 0) {
            return res.status(404).json({ mensagem: 'Nenhuma loja encontrada para esta empresa.' });
        }

        const idsLojas = lojas.map(loja => loja.id);

        // Busca produtos de todas as lojas da empresa
        const { data, error } = await supabase
            .from('produto')
            .select(`
                *,
                categorias (
                    nome,
                    id
                )
            `)
            .in('id_loja', idsLojas); // Busca produtos onde 'id_loja' está na lista de IDs de lojas da empresa

        if (error) {
            console.error('Controller: Erro do modelo ao listar produtos por empresa:', error);
            return res.status(500).json({ mensagem: "Erro ao listar produtos por empresa.", erro: error });
        }
        return res.status(200).json(data);
    } catch (erro) {
        console.error('Controller: ERRO INESPERADO ao listar produtos por empresa:', erro.message, erro.stack);
        return res.status(500).json({
            mensagem: "Erro inesperado ao listar produtos por empresa.",
            erro: erro.message,
        });
    }
};

// --- FUNÇÃO atualizarProduto ---
export const atualizarProduto = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando atualizarProduto!');
    console.log('DEBUG: req.params:', req.params);
    console.log('DEBUG: req.body (dados do formulário):', req.body);
    console.log('DEBUG: req.file (se houver imagem):', req.file);

    try {
        const id = req.params.id;
        console.log('DEBUG: ID do produto a ser atualizado (req.params.id):', id);

        const {
            nome,
            categoria_id,
            preco,
            descricao,
            tamanhos,
            controlar_estoque,
            quantidade, // Este é o campo de estoque
            id_loja, // Este id_loja deve vir do req.body
            itens,
            desconto,
            removerImagemExistente
        } = req.body;

        const novaImagemFile = req.file;
        console.log('DEBUG: Nova imagem (req.file):', novaImagemFile ? novaImagemFile.originalname : 'Nenhuma nova imagem enviada');
        console.log('DEBUG: Flag removerImagemExistente:', removerImagemExistente);

        if (!id_loja) {
            console.error('DEBUG: Erro: ID da loja não fornecido no req.body.');
            return res.status(400).json({ mensagem: 'ID da loja não fornecido na requisição de atualização.' });
        }

        console.log('DEBUG: ID da loja do frontend (req.body.id_loja):', id_loja);

        // --- AUTORIZAÇÃO: Verificar se a empresa autenticada é dona do produto ---
        const { empresaId: id_empresa_autenticada, error: tokenError } = await getEmpresaIdFromToken(req);
        if (tokenError) return res.status(401).json({ error: tokenError.message });

        console.log('DEBUG: ID da empresa autenticada (id_empresa_autenticada):', id_empresa_autenticada);

        const { data: lojaDoUsuario, error: erroLojaUsuario } = await lojaModel.buscarLojaPorId(parseInt(id_loja, 10));
        console.log('DEBUG: Loja do usuário encontrada:', lojaDoUsuario);
        console.log('DEBUG: Erro ao buscar loja do usuário:', erroLojaUsuario);

        if (erroLojaUsuario || !lojaDoUsuario || lojaDoUsuario.id_empresa !== id_empresa_autenticada) {
            console.error('Controller: Erro de autorização ou loja não encontrada:', erroLojaUsuario || 'Loja não pertence ao usuário autenticado.');
            return res.status(403).json({ mensagem: 'Não autorizado: A loja informada não pertence à sua empresa ou não existe.' });
        }

        // Busca o produto existente para obter a URL da imagem antiga
        const { data: produtoExistente, error: selectError } = await supabase
            .from("produto")
            .select("image, id_loja") // Busca também id_loja para re-verificação
            .eq("id", id)
            .single();

        console.log('DEBUG: Produto existente encontrado:', produtoExistente);
        console.log('DEBUG: Erro ao buscar produto existente:', selectError);

        if (selectError) {
            console.error('Controller: Erro ao buscar produto para atualização:', selectError);
            if (selectError.code === 'PGRST116') {
                return res.status(404).json({ mensagem: "Produto não encontrado ou não pertence à loja informada." });
            }
            return res.status(500).json({ mensagem: "Erro ao buscar produto existente para atualização.", erro: selectError.message });
        }
        if (!produtoExistente) {
            console.error('Controller: Produto não encontrado ou não pertence à loja informada (após select).');
            return res.status(404).json({ mensagem: "Produto não encontrado ou não pertence à loja informada." });
        }

        // Re-verificar se a loja do produto corresponde à loja do request (dupla checagem de segurança)
        if (produtoExistente.id_loja !== parseInt(id_loja, 10)) {
            return res.status(403).json({ mensagem: "Acesso negado: ID da loja do produto não corresponde ao ID da loja fornecido." });
        }


        // --- PARSING E CONVERSÃO DE TIPOS ---
        console.log('DEBUG: Tentando parsear tamanhos:', tamanhos);
        const tamanhosParsed = tamanhos ? JSON.parse(tamanhos) : null;
        console.log('DEBUG: Tamanhos parseados:', tamanhosParsed);

        console.log('DEBUG: Tentando parsear itens:', itens);
        const itensParsed = itens ? JSON.parse(itens) : null;
        console.log('DEBUG: Itens parseados:', itensParsed);

        console.log('DEBUG: Tentando parsear desconto:', desconto);
        const descontoParsed = desconto ? parseFloat(desconto) : null;
        console.log('DEBUG: Desconto parseado:', descontoParsed);

        console.log('DEBUG: Tentando parsear controlar_estoque:', controlar_estoque);
        const controlarEstoqueParsed = controlar_estoque === 'true'; // Converte string "true"/"false" para booleano
        console.log('DEBUG: Controlar estoque parseado (booleano):', controlarEstoqueParsed);

        console.log('DEBUG: Tentando parsear quantidade:', quantidade);
        const quantidadeParsed = controlarEstoqueParsed ? parseInt(quantidade, 10) : 0;
        console.log('DEBUG: Quantidade parseada:', quantidadeParsed);

        console.log('DEBUG: Tentando parsear preco:', preco);
        const precoParsed = parseFloat(preco);
        console.log('DEBUG: Preço parseado:', precoParsed);

        console.log('DEBUG: Tentando parsear categoria_id:', categoria_id);
        const categoriaIdParsed = parseInt(categoria_id, 10);
        console.log('DEBUG: Categoria ID parseada:', categoriaIdParsed);

        // Lógica de imagem
        let novaImagemUrl = produtoExistente.image;
        if (removerImagemExistente === 'true' && produtoExistente.image) {
            console.log('DEBUG: Flag para remover imagem existente detectada. Deletando imagem antiga.');
            await ImageModel.deletarImagem(produtoExistente.image); // Retorna {error: bool, message: string}
            novaImagemUrl = null; // Garante que o campo 'image' será nulo no banco
        } else if (novaImagemFile) {
            console.log('DEBUG: Nova imagem file detectada. Processando upload...');
            if (produtoExistente.image) {
                console.log('DEBUG: Deletando imagem antiga antes de salvar a nova.');
                await ImageModel.deletarImagem(produtoExistente.image);
            }
            novaImagemUrl = await ImageModel.salvarImagem(
                novaImagemFile.buffer,
                novaImagemFile.originalname,
                novaImagemFile.mimetype,
                parseInt(id_loja, 10)
            );
            if (!novaImagemUrl) {
                console.error('DEBUG: Erro ao salvar a nova imagem do produto.');
                return res.status(500).json({ mensagem: 'Erro ao salvar a nova imagem do produto.' });
            }
            console.log('DEBUG: Nova URL da imagem:', novaImagemUrl);
        } else {
            console.log('DEBUG: Nenhuma nova imagem para upload e nenhuma requisição de remoção. Mantendo imagem existente.');
        }

        const updateData = {
            nome,
            categoria_id: categoriaIdParsed,
            preco: precoParsed,
            descricao,
            tamanhos: tamanhosParsed,
            controlar_estoque: controlarEstoqueParsed,
            quantidade: quantidadeParsed, // <-- ATUALIZADO: Usar 'quantidade'
            itens: itensParsed,
            desconto: descontoParsed,
            image: novaImagemUrl,
        };

        console.log("DEBUG: Dados finais para atualização do produto:", updateData);

        const { error: updateError } = await produtoModel.atualizarProduto(id, updateData);

        if (updateError) {
            console.error("Controller: Erro ao atualizar produto no modelo:", updateError);
            return res.status(500).json({ mensagem: "Erro ao atualizar produto no banco de dados.", erro: updateError.message });
        }

        const { data: updatedProduct, error: fetchUpdatedError } = await supabase
            .from("produto")
            .select(`*, categorias(nome, id)`)
            .eq("id", id)
            .single();

        if (fetchUpdatedError) {
            console.error("Controller: Erro ao buscar produto atualizado para retorno:", fetchUpdatedError.message);
            return res.status(200).json({
                mensagem: "Produto atualizado com sucesso, mas não foi possível retornar os dados atualizados.",
                warning: fetchUpdatedError.message
            });
        }

        return res.status(200).json({ mensagem: "Produto atualizado com sucesso", product: updatedProduct });

    } catch (err) {
        console.error("Controller: Erro inesperado no controlador atualizarProduto (catch geral):", err);
        if (err instanceof SyntaxError && err.message.includes('JSON')) {
            return res.status(400).json({
                mensagem: "Dados enviados estão malformados (erro de JSON).",
                erro: err.message,
            });
        }
        return res.status(500).json({
            mensagem: "Erro interno do servidor ao atualizar produto.",
            erro: err.message,
        });
    }
};

// --- FUNÇÃO deleteProduto ---
export const deleteProduto = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando deleteProduto!');
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ mensagem: 'ID do produto não fornecido para exclusão.' });
        }

        // --- AUTENTICAÇÃO E AUTORIZAÇÃO (CRUCIAL!) ---
        const { empresaId: empresaIdDoToken, error: tokenError } = await getEmpresaIdFromToken(req);
        if (tokenError) {
            console.warn('DEBUG: Token não fornecido ou inválido para exclusão.');
            return res.status(401).json({ error: tokenError.message });
        }
        console.log('DEBUG: Empresa ID do token para exclusão:', empresaIdDoToken);

        // 1. Buscar o produto para obter o id_loja associado
        const { data: produtoParaDeletar, error: produtoFetchError } = await supabase
            .from('produto')
            .select('id_loja, image')
            .eq('id', id)
            .single();

        if (produtoFetchError) {
            console.error('DEBUG: Erro Supabase ao buscar produto para exclusão:', produtoFetchError.message);
            if (produtoFetchError.code === 'PGRST116') {
                return res.status(404).json({ mensagem: 'Produto não encontrado ou ID inválido.' });
            }
            return res.status(500).json({ mensagem: 'Erro ao verificar produto para exclusão.' });
        }
        if (!produtoParaDeletar) {
            console.warn('DEBUG: Produto com ID', id, 'não encontrado para exclusão.');
            return res.status(404).json({ mensagem: 'Produto não encontrado.' });
        }

        // 2. Buscar a loja para obter o id_empresa associado
        const { data: lojaDoProduto, error: lojaFetchError } = await lojaModel.buscarLojaPorId(produtoParaDeletar.id_loja);
        if (lojaFetchError || !lojaDoProduto) {
            console.error('DEBUG: Erro ao buscar loja do produto para exclusão ou loja não encontrada:', lojaFetchError?.message || 'Loja do produto não encontrada.');
            return res.status(500).json({ mensagem: 'Não foi possível verificar a propriedade do produto (loja não encontrada).' });
        }
        const empresaIdDaLojaDoProduto = lojaDoProduto.id_empresa;
        console.log('DEBUG: Empresa ID da loja do produto:', empresaIdDaLojaDoProduto);

        // 3. Comparar os IDs das empresas para autorização
        if (empresaIdDoToken !== empresaIdDaLojaDoProduto) {
            console.warn('DEBUG: Tentativa de exclusão não autorizada. Token Empresa ID:', empresaIdDoToken, 'Produto Empresa ID:', empresaIdDaLojaDoProduto);
            return res.status(403).json({ mensagem: 'Acesso negado: Você não tem permissão para excluir este produto.' });
        }
        // --- FIM DA AUTORIZAÇÃO ---

        // Se autorizado, prosseguir com a exclusão do produto e da imagem (se houver)
        if (produtoParaDeletar.image) {
            console.log('DEBUG: Tentando deletar imagem do storage:', produtoParaDeletar.image);
            const { error: deleteImageError } = await ImageModel.deletarImagem(produtoParaDeletar.image); // Esta função retorna { error: bool, message: string }
            if (deleteImageError) {
                console.error('DEBUG: Erro ao deletar imagem do Storage (pode não ser crítico se o produto for deletado):', deleteImageError.message || deleteImageError);
            } else {
                console.log('DEBUG: Imagem do produto deletada do Storage.');
            }
        }

        // Excluir o produto do banco de dados
        const { error: deleteProductError } = await supabase
            .from('produto')
            .delete()
            .eq('id', id);

        if (deleteProductError) {
            console.error('DEBUG: Erro Supabase ao excluir produto permanentemente:', deleteProductError.message);
            return res.status(500).json({ mensagem: 'Erro interno do servidor ao excluir o produto.' });
        }

        console.log(`Produto com ID ${id} excluído permanentemente.`);
        return res.status(204).send();

    } catch (error) {
        console.error('DEBUG: Erro inesperado no deleteProduto:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
};

// --- FUNÇÃO ajustarEstoqueProduto ---
export const ajustarEstoqueProduto = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando ajustarEstoqueProduto!');
    try {
        const { id } = req.params; // ID do produto a ser ajustado
        const { novaQuantidade } = req.body; // Nova quantidade de estoque (vindo do frontend)

        if (!id || typeof novaQuantidade === 'undefined' || novaQuantidade < 0) {
            return res.status(400).json({ mensagem: 'ID do produto ou nova quantidade inválidos.' });
        }

        // --- AUTENTICAÇÃO E AUTORIZAÇÃO (CRÍTICO!) ---
        const { empresaId: empresaIdDoToken, error: tokenError } = await getEmpresaIdFromToken(req);
        if (tokenError) {
            console.warn('DEBUG: Token não fornecido ou inválido para ajuste de estoque.');
            return res.status(401).json({ error: tokenError.message });
        }
        console.log('DEBUG: Empresa ID do token para ajuste de estoque:', empresaIdDoToken);

        // 1. Buscar o produto para obter o id_loja associado E controlar_estoque
        const { data: produtoExistente, error: produtoFetchError } = await supabase
            .from('produto')
            .select('id_loja, controlar_estoque') // <-- ADICIONADO: selecionar controlar_estoque
            .eq('id', id)
            .single();

        if (produtoFetchError) {
            console.error('DEBUG: Erro Supabase ao buscar produto para ajuste de estoque:', produtoFetchError.message);
            if (produtoFetchError.code === 'PGRST116') {
                return res.status(404).json({ mensagem: 'Produto não encontrado ou ID inválido para ajuste de estoque.' });
            }
            return res.status(500).json({ mensagem: 'Erro ao verificar produto para ajuste de estoque.' });
        }
        if (!produtoExistente) {
            console.warn('DEBUG: Produto com ID', id, 'não encontrado para ajuste de estoque.');
            return res.status(404).json({ mensagem: 'Produto não encontrado.' });
        }

        // --- NOVO: Checar se o controle de estoque está ativado para este produto ---
        if (produtoExistente.controlar_estoque === false) { // Verifica se é explicitamente falso
            console.warn(`DEBUG: Ajuste de estoque negado para produto ${id}: Controle de estoque não está ativo.`);
            return res.status(403).json({ mensagem: 'Ajuste de estoque negado: Controle de estoque não está ativo para este produto.' });
        }


        // 2. Buscar a loja para obter o id_empresa associado
        const { data: lojaDoProduto, error: lojaFetchError } = await lojaModel.buscarLojaPorId(produtoExistente.id_loja);
        if (lojaFetchError || !lojaDoProduto) {
            console.error('DEBUG: Erro ao buscar loja do produto para ajuste de estoque ou loja não encontrada:', lojaFetchError?.message || 'Loja do produto não encontrada.');
            return res.status(500).json({ mensagem: 'Não foi possível verificar a propriedade do produto (loja não encontrada).' });
        }
        const empresaIdDaLojaDoProduto = lojaDoProduto.id_empresa;
        console.log('DEBUG: Empresa ID da loja do produto:', empresaIdDaLojaDoProduto);

        // 3. Comparar os IDs das empresas para autorização
        if (empresaIdDoToken !== empresaIdDaLojaDoProduto) {
            console.warn('DEBUG: Tentativa de ajuste de estoque não autorizada. Token Empresa ID:', empresaIdDoToken, 'Produto Empresa ID:', empresaIdDaLojaDoProduto);
            return res.status(403).json({ mensagem: 'Acesso negado: Você não tem permissão para ajustar o estoque deste produto.' });
        }
        // --- FIM DA AUTORIZAÇÃO ---


        // Se a autorização passou e o controle de estoque está ativo, atualize a quantidade
        const { data, error } = await supabase
            .from('produto')
            .update({ quantidade: novaQuantidade }) // <-- ATUALIZADO: Usar 'quantidade'
            .eq('id', id);

        if (error) {
            console.error('Erro ao ajustar estoque no Supabase:', error.message);
            return res.status(500).json({ mensagem: 'Erro interno ao ajustar estoque.' });
        }

        return res.status(200).json({ mensagem: 'Estoque ajustado com sucesso.', produtoId: id, novaQuantidade });

    } catch (error) {
        console.error('Erro inesperado em ajustarEstoqueProduto:', error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }
        return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
    }
};

export const inserirAvaliacao = async (req, res) => {
    console.log('DEBUG req.params:', req.params);
    const produto_id = parseInt(req.params.id);
    const { nome, rating, comentario } = req.body;

    if (!produto_id || !nome || !rating) {
        return res.status(400).json({ error: 'Campos obrigatórios: nome e rating.' });
    }

    const { data, error } = await produtoModel.inserirAvaliacaoModel({
        produto_id,
        nome,
        rating,
        comentario
    });

    if (error) {
        return res.status(500).json({ error });
    }

    res.status(201).json({ mensagem: 'Avaliação registrada com sucesso!', avaliacao: data });
};


export const listarAvaliacoesPorProduto = async (req, res) => {
    console.log('DEBUG: Entrou em listarAvaliacoesPorProduto');
    console.log('DEBUG: req.params:', req.params);
    const produto_id = parseInt(req.params.id);

    if (!produto_id) {
        return res.status(400).json({ error: 'ID do produto inválido.' });
    }

    // Chama a função do model que já traz as avaliações com o nome do usuário
    const { data, error } = await produtoModel.buscarAvaliacoesPorProduto(produto_id);

    if (error) {
        return res.status(500).json({ error });
    }

    res.status(200).json(data);
};
