import supabase from '../config/SupaBase.js';



export async function buscarEmpresaPorId(id) {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();
  
    if (error) throw error;
    return data;
  };

  