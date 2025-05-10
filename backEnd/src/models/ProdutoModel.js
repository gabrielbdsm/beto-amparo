import supabase from '../config/SupaBase.js';

export const inserirProduto = async ({ id_empresa, nome, categoria, image, preco, descricao, tamanhos, controlarEstoque, quantidade }) => {
  try {
    const {  error } = await supabase
      .from('produto')
      .insert([{
        id_empresa,
        nome,
        image,
        categoria,
        preco,
        descricao,
        tamanhos, // Já é um array, será armazenado como JSON
        controlar_estoque: controlarEstoque, // Boolean
        quantidade: quantidade || 0, // Integer
      }]);
    
    if (error) {
      return {  error: error.message };
    }

    return {  error: null };
  } catch (err) {
    return {  error: err.message };
  }
};

export const listarProdutos = async () => {
  try {
    const { data, error } = await supabase
      .from('produto')
      .select('*');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

export const deletarProduto = async (id) => {
  try {
    const { data, error } = await supabase
      .from('produto')
      .delete()
      .eq('id', id);
      
    if (error) {
      return {  error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return {  error: err.message };
  }
};

export const atualizarProduto = async (id, camposAtualizados) => {
  try {
    const { data, error } = await supabase
      .from('produto')
      .update(camposAtualizados)
      .eq('id', id);
    
    if (error) {
      return { data: null, error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

export const listarProdutoPorId = async (id) => {
  try {
    const { data, error } = await supabase
      .from('produto')
      .select('*')
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

export const listarProdutosPorEmpresa = async (empresaId) => {
  return await supabase
    .from("produto")
    .select("*")
    .eq("id_empresa", empresaId); 
};
