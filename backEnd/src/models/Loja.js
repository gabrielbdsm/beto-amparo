import supabase from '../config/SupaBase.js';


export async function buscarIdLoja(id_empresa) {
  const { data, error } = await supabase
    .from('loja')
    .select('id')
    .eq('id_empresa', id_empresa)
   

  if (error) {
    throw new Error(`Erro ao fazer login: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return { error: 'Loja não encontrada' };
  }

  

  return { data: data[0] };
}
