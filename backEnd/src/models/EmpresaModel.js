import supabase from '../config/SupaBase.js';
import bcrypt from 'bcrypt';

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

export async function buscarEmpresaPorId(id) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export async function LoginEmpresa(email, senha) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('email', email)

 
    const senhaCorreta = await bcrypt.compare(senha, data[0].senha);
    if (!senhaCorreta) {
      return { error: 'Senha incorreta', data: null };
    }
  if (error) {
    throw new Error(`Erro ao fazer login: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return { error: 'Email ou senha inválidos' };
  }

  if (data.length > 1) {
    return { error: 'Erro de duplicidade de email. Contate o suporte.' };
  }

  return { data: data[0] };
}
