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
      .from('empresas')
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
