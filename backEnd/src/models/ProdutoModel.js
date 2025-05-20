import supabase from '../config/SupaBase.js';

export const inserirProduto = async ({ id_loja, nome, categoria, image, preco, descricao, tamanhos, controlarEstoque, quantidade }) => {
  try {
    const {  error } = await supabase
      .from('produto')
      .insert([{
        id_loja,
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

export const listarProdutosPorEmpresa = async (id_empresa) => {
  const data_loja =  await supabase
    .from("loja")
    .select("*")
    .eq("id_empresa",id_empresa); 

  if (data_loja.error) {
    return { data: null, error: data_loja.error.message };
  }
  const id_loja = data_loja.data[0].id;
  if (!id_loja) {
    return { data: null, error: "Loja não encontrada" };
  }

  const { data, error } =  await supabase
    .from("produto")
    .select("*")
    .eq("id_loja",id_loja); 
    try {

    if (error) {
      return { data: null, error: error.message };
    }

    return { data };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

export const listarProdutosPorLoja = async (lojaId) => {
  
  
  const data = await supabase
    .from("produto")
    .select("*")
    .eq("id_loja", lojaId); 

    return data;
};


