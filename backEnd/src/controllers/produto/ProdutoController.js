// backend/controllers/produto/ProdutoController.js

console.log('DEBUG: ProdutoController.js: INÍCIO DO ARQUIVO'); // Primeiro log

import * as produtoModel from '../../models/ProdutoModel.js';
console.log('DEBUG: ProdutoController.js: produtoModel importado');

import { validarProduto } from '../../validators/ProdutoValidators.js';
console.log('DEBUG: ProdutoController.js: validarProduto importado');

import * as ImageModel from '../../models/ImageModel.js';
console.log('DEBUG: ProdutoController.js: ImageModel importado');

import * as lojaModel from '../../models/Loja.js';
console.log('DEBUG: ProdutoController.js: lojaModel importado');

import supabase from '../../config/SupaBase.js';
console.log('DEBUG: ProdutoController.js: supabase importado');

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
        // Certifique-se de que estas variáveis estão declaradas aqui no início do try
        const tamanhosParsed = tamanhos ? JSON.parse(tamanhos) : [];
        const controlarEstoqueBool = controlar_estoque === 'true';
        const quantidadeParsed = controlarEstoqueBool ? parseInt(quantidade, 10) || 0 : 0;
        const precoParsed = parseFloat(preco);
        const categoriaIdParsed = parseInt(categoria_id, 10); // <-- Declarada e usada aqui

        // Validações básicas de dados de entrada
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

        // Validação adicional do produto com sua função validarProduto
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

        // --- Verificação de Autorização ---
        const id_empresa_autenticada = req.Id; // ID da empresa vindo do JWT através do middleware

        // Logs de depuração para os IDs
        console.log('DEBUG: ID da loja recebido do frontend (id_loja):', id_loja, 'Tipo:', typeof id_loja);
        console.log('DEBUG: ID da empresa autenticada do JWT (id_empresa_autenticada):', id_empresa_autenticada, 'Tipo:', typeof id_empresa_autenticada);

        if (!id_empresa_autenticada) {
            return res.status(401).json({ mensagem: 'Não autorizado: ID da empresa não fornecido no token.' });
        }

        // Busca os dados completos da loja para verificar a propriedade
        console.log('DEBUG: Buscando loja pelo ID:', lojaIdNum);
        const { data: lojaDoUsuario, error: erroLojaUsuario } = await lojaModel.buscarLojaPorId(lojaIdNum);
        console.log('DEBUG: Resultado da busca da loja:', lojaDoUsuario, 'Erro:', erroLojaUsuario);

        // Logs de depuração para o ID da empresa da loja
        console.log('DEBUG: ID da empresa da loja (lojaDoUsuario?.id_empresa):', lojaDoUsuario?.id_empresa, 'Tipo:', typeof lojaDoUsuario?.id_empresa);

        if (erroLojaUsuario || !lojaDoUsuario || lojaDoUsuario.id_empresa !== id_empresa_autenticada) {
            console.error('Controller: Erro de autorização ou loja não encontrada:', erroLojaUsuario || 'Loja não pertence ao usuário.');
            return res.status(403).json({ mensagem: 'Não autorizado: A loja informada não pertence à sua empresa ou não existe.' });
        }

        // --- Salvar Imagem ---
        console.log('DEBUG: Loja verificada, prosseguindo para salvar imagem...');
        const URlimagem = await ImageModel.salvarImagem(imagem.buffer, imagem.originalname, imagem.mimetype, lojaIdNum);
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
            quantidade: quantidadeParsed,
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
console.log('DEBUG: ProdutoController.js: criarProduto exportado.');


// 2. FUNÇÃO getProdutos (Listar Todos os Produtos)
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
console.log('DEBUG: ProdutoController.js: getProdutos exportado.');


// FUNÇÃO inativarProduto (REINCORPORADA E CORRETA)
export const inativarProduto = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando inativarProduto!');
    try {
        const { id } = req.params;

        console.log('DEBUG InativarProduto: Tentando inativar produto com ID:', id);

        if (!id) {
            console.log('DEBUG InativarProduto: ID do produto não fornecido.');
            return res.status(400).json({ mensagem: 'ID do produto não fornecido.' });
        }

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
console.log('DEBUG: ProdutoController.js: inativarProduto exportado.');


// FUNÇÃO ativarProduto (REINCORPORADA E CORRETA)
export const ativarProduto = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando ativarProduto!');
    try {
        const { id } = req.params;

        console.log('DEBUG AtivarProduto: Tentando ativar produto com ID:', id);

        if (!id) {
            console.log('DEBUG AtivarProduto: ID do produto não fornecido.');
            return res.status(400).json({ mensagem: 'ID do produto não fornecido.' });
        }

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
console.log('DEBUG: ProdutoController.js: ativarProduto exportado.');


// FUNÇÃO buscarProdutoPorId (Mantida, mas com ajuste de select)
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
console.log('DEBUG: ProdutoController.js: buscarProdutoPorId exportado.');



export const listarProdutosPorLoja = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando listarProdutosPorLoja!');
    try {
        const { slug } = req.params;
        console.log('DEBUG: Slug recebido na API de produtos:', slug); // <--- ADICIONE ESTA LINHA!
        const { ativo } = req.query;

        let idDaLojaNoDB;

        if (!slug) {
            return res.status(400).json({ mensagem: "Identificador da loja (slug) não fornecido." });
        }

        const { data: lojaData, error: lojaError } = await lojaModel.buscarLojaPorSlugCompleta(slug);

        if (lojaError || !lojaData) {
            console.error("Controller: Erro ao buscar loja por SLUG em listarProdutosPorLoja:", lojaError);
            return res.status(404).json({ mensagem: "Loja não encontrada com o identificador fornecido." });
        }

        idDaLojaNoDB = lojaData.id;

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

        if (ativo === 'false') {
            query = query.eq('ativo', false);
        } else {
            query = query.eq('ativo', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Controller: Erro do modelo ao listar produtos:", error);
            return res.status(500).json({ mensagem: "Erro ao listar produtos.", erro: error });
        }
        return res.status(200).json(data);
    } catch (erro) {
        console.error('Controller: ERRO INESPERADO ao listar produtos por loja:', erro.message, erro.stack);
        return res.status(500).json({
            mensagem: "Erro inesperado ao listar produtos.",
            erro: erro.message,
        });
    }
};
console.log('DEBUG: ProdutoController.js: listarProdutosPorLoja exportado.');


export const listarProdutosPorEmpresa = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando listarProdutosPorEmpresa!');
    try {
        const id_empresa = req.params.empresaId;

        if (!id_empresa) {
            return res.status(400).json({ mensagem: 'ID da empresa não fornecido.' });
        }

        const { data, error } = await produtoModel.listarProdutosPorEmpresa(id_empresa);

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

export const atualizarProduto = async (req, res) => {
    console.log('DEBUG: ProdutoController.js: Chamando atualizarProduto!');
    console.log('DEBUG: req.params:', req.params); // O ID do produto na URL
    console.log('DEBUG: req.body (dados do formulário):', req.body); // Todos os campos do FormData (exceto arquivo)
    console.log('DEBUG: req.file (se houver imagem):', req.file); // O objeto do arquivo de imagem (se multer configurado)

    try {
        // O ID do produto deve vir dos parâmetros da URL, não do body
        const id = req.params.id;
        console.log('DEBUG: ID do produto a ser atualizado (req.params.id):', id);

        const {
            nome,
            categoria_id,
            preco,
            descricao,
            tamanhos,
            controlar_estoque,
            quantidade,
            id_loja, // Este id_loja deve vir do req.body ou de algum outro lugar
            itens,
            desconto,
            removerImagemExistente // Adicionado para capturar a flag de remoção
        } = req.body;

        const novaImagemFile = req.file;
        console.log('DEBUG: Nova imagem (req.file):', novaImagemFile ? novaImagemFile.originalname : 'Nenhuma nova imagem enviada');
        console.log('DEBUG: Flag removerImagemExistente:', removerImagemExistente);


        // IMPORTANTE: id_loja do frontend deve vir como 'id_loja' no FormData
        // Verifique se 'id_loja' está chegando no req.body
        if (!id_loja) {
            console.error('DEBUG: Erro: ID da loja não fornecido no req.body.');
            return res.status(400).json({ mensagem: 'ID da loja não fornecido na requisição de atualização.' });
        }
        
        console.log('DEBUG: ID da loja do frontend (req.body.id_loja):', id_loja);

        const id_empresa_autenticada = req.Id; // Assumindo que req.Id vem do seu middleware de autenticação
        console.log('DEBUG: ID da empresa autenticada (req.Id):', id_empresa_autenticada);

        if (!id_empresa_autenticada) {
            console.error('DEBUG: Erro: ID da empresa autenticada não disponível.');
            return res.status(401).json({ mensagem: 'Não autorizado: ID da empresa não disponível no token.' });
        }

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
            .select("image")
            .eq("id", id)
            .eq("id_loja", parseInt(id_loja, 10))
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

        // --- PARSING E CONVERSÃO DE TIPOS ---
        // Aqui é onde os erros 400 frequentemente acontecem se os dados não são como esperado
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
            await ImageModel.deletarImagem(produtoExistente.image);
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
            quantidade: quantidadeParsed,
            itens: itensParsed, // Assumindo que 'itens' e 'desconto' são campos opcionais
            desconto: descontoParsed,
            image: novaImagemUrl,
        };

        console.log("DEBUG: Dados finais para atualização do produto:", updateData);

        // Chamada ao modelo para atualizar o produto no banco de dados
        const { error: updateError } = await produtoModel.atualizarProduto(id, updateData);

        if (updateError) {
            console.error("Controller: Erro ao atualizar produto no modelo:", updateError);
            return res.status(500).json({ mensagem: "Erro ao atualizar produto no banco de dados.", erro: updateError.message });
        }

        // Busca o produto atualizado para retornar
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
        // Retorna um 400 Bad Request se for um erro de parsing (ex: JSON inválido)
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
console.log('DEBUG: ProdutoController.js: atualizarProduto exportado.');

console.log('DEBUG: ProdutoController.js: FIM DO ARQUIVO.');