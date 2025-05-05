import supabase from '../config/SupaBase.js';

export const inserirEmpresa = async ({
  nome,
  cnpj,
  responsavel,
  categoria,
  telefone,
  endereco,
  cidade,
  uf,
  site,
  email,
  senha,
}) => {
  try {
    const { error } = await supabase
      .from('empresa')
      .insert([{
        nome,
        cnpj,
        responsavel,
        categoria,
        telefone,
        endereco,
        cidade,
        uf,
        site,
        email,
        senha,
      }]);

    if (error) return { error: error.message };
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
};

export async function buscarEmpresaPorId(id) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
};
