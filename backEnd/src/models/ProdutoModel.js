// backend/models/ProdutoModel.js
import supabase from '../config/SupaBase.js';

// --- Função para inserir um novo produto ---
export const inserirProduto = async ({ id_loja, nome, categoria_id, image, preco, descricao, tamanhos, controlar_estoque, quantidade }) => {
    try {
        const { data, error } = await supabase
            .from('produto')
            .insert([{
                id_loja,
                nome,
                image,
                categoria_id,
                preco,
                descricao,
                tamanhos,
                controlar_estoque,
                quantidade: quantidade || 0,
                ativo: true,
            }])
            .select('*');

        if (error) {
            console.error('ProdutoModel: Erro ao inserir produto:', error);
            return { data: null, error: error.message };
        }

        return { data: data[0], error: null };
    } catch (err) {
        console.error('ProdutoModel: Erro inesperado em inserirProduto:', err);
        return { data: null, error: err.message };
    }
};

// --- Função para listar todos os produtos (sem filtro de loja ou empresa) ---
export const listarProdutos = async () => {
    try {
        const { data, error } = await supabase
            .from('produto')
            .select(`
                *,
                categorias (
                    nome,
                    id
                )
            `);

        if (error) {
            console.error('ProdutoModel: Erro ao listar todos os produtos:', error);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (err) {
        console.error('ProdutoModel: Erro inesperado em listarProdutos:', err);
        return { data: null, error: err.message };
    }
};

// --- Função para atualizar um produto ---
export const atualizarProduto = async (id, camposAtualizados) => {
    try {
        const { data, error } = await supabase
            .from('produto')
            .update(camposAtualizados)
            .eq('id', id)
            .select('*');

        if (error) {
            console.error('ProdutoModel: Erro ao atualizar produto:', error);
            return { data: null, error: error.message };
        }

        return { data: data[0], error: null };
    } catch (err) {
        console.error('ProdutoModel: Erro inesperado em atualizarProduto:', err);
        return { data: null, error: err.message };
    }
};

// --- Função para listar produto por ID ---
export const listarProdutoPorId = async (id) => {
    try {
        const { data, error } = await supabase
            .from('produto')
            .select(`
                *,
                categorias (
                    nome,
                    id
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('ProdutoModel: Erro ao listar produto por ID:', error);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (err) {
        console.error('ProdutoModel: Erro inesperado em listarProdutoPorId:', err);
        return { data: null, error: err.message };
    }
};

// --- Função para listar produtos por empresa ---
export const listarProdutosPorEmpresa = async (id_empresa) => {
    try {
        const { data: lojas_da_empresa, error: error_loja } = await supabase
            .from("loja")
            .select("id")
            .eq("id_empresa", id_empresa);

        if (error_loja) {
            console.error('ProdutoModel: Erro ao buscar lojas da empresa:', error_loja);
            return { data: null, error: error_loja.message };
        }
        if (!lojas_da_empresa || lojas_da_empresa.length === 0) {
            return { data: [], error: null };
        }

        const ids_lojas = lojas_da_empresa.map(loja => loja.id);

        const { data, error } = await supabase
            .from("produto")
            .select(`
                *,
                categorias (
                    nome,
                    id
                )
            `)
            .in("id_loja", ids_lojas);

        if (error) {
            console.error('ProdutoModel: Erro ao listar produtos por loja:', error);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (err) {
        console.error('ProdutoModel: Erro inesperado em listarProdutosPorEmpresa:', err.message, err.stack);
        return { data: null, error: err.message };
    }
};

// --- Função para listar produtos por loja ---
export const listarProdutosPorLoja = async (lojaId) => {
    try {
        const { data, error } = await supabase
            .from("produto")
            .select(`
                *,
                categorias (
                    nome,
                    id
                )
            `)
            .eq("id_loja", lojaId);

        if (error) {
            console.error('ProdutoModel: Erro ao listar produtos por loja:', error.message);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (err) {
        console.error('ProdutoModel: Erro inesperado em listarProdutosPorLoja:', err.message, err.stack);
        return { data: null, error: err.message };
    }
};

export const getProduto = async (ids) => {
    try {
        const { data, error } = await supabase
            .from('produto')
            .select('nome, id , preco')
            .in('id', ids);

        if (error) {
            console.error('Erro ao buscar pedido_itens:', error.message);
            return [];
        }

        return data ?? [];
    } catch (e) {
        console.error('Erro inesperado em getPedido_itens:', e);
        return [];
    }
};

// --- NOVO: Inserir uma avaliação ---
export const inserirAvaliacaoModel = async ({ produto_id, nome, rating, comentario }) => {
    try {
        const { data, error } = await supabase
            .from('avaliacoes')
            .insert([{
                produto_id,
                nome,
                rating,
                comentario,
            }])
            .select('*');

        if (error) {
            console.error('ProdutoModel: Erro ao inserir avaliação:', error.message);
            return { data: null, error: error.message };
        }

        return { data: data[0], error: null };
    } catch (err) {
        console.error('ProdutoModel: Erro inesperado em inserirAvaliacao:', err.message);
        return { data: null, error: err.message };
    }
};

// --- NOVO: Listar avaliações de um produto ---
export const buscarAvaliacoesPorProduto = async (produto_id) => {
    try {
        const { data, error } = await supabase
            .from('avaliacoes')
            .select(`*`)
            .eq('produto_id', produto_id)
            .order('data', { ascending: false });

        if (error) {
            console.error('ProdutoModel: Erro ao listar avaliações:', error.message);
            return { data: null, error: error.message };
        }

        return { data, error: null };
    } catch (err) {
        console.error('ProdutoModel: Erro inesperado em buscarAvaliacoesPorProduto:', err.message);
        return { data: null, error: err.message };
    }
};
