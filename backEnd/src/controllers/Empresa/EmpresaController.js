import { inserirEmpresa } from '../../models/EmpresaModel.js';
import * as empresas from '../../models/EmpresaModel.js'
import supabase from '../../config/SupaBase.js';

export async function getEmpresaBySlug(req, res) {
  const slug = req.params.slug.toLowerCase(); 

  try {
    const { data, error } = await supabase
      .from('loja')
      .select('id_empresa, nome_fantasia, foto_loja')
      .eq('slug_loja', slug )
      .single();
    
    if (error || !data || data.length === 0) {
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    const empresa = await empresas.buscarEmpresaPorId(data.id_empresa);

    if (!empresa) {
      return res.status(404).json({ erro: 'Empresa não encontrada' });
    }

    res.status(200).json({
      ...empresa,
      nome_fantasia: data.nome_fantasia,
      foto_loja: data.foto_loja
    });
    
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ erro: err.message });
  }
}
export const marcarPersonalizacaoCompleta = async (req, res) => {
  // Assume que req.Id está disponível pelo middleware protectRoutes
  const idEmpresa = req.Id;

  if (!idEmpresa) {
      return res.status(400).json({ mensagem: 'ID da empresa não fornecido.' });
  }

  try {
      const { success, error } = await empresas.marcarPrimeiroLoginFeito(idEmpresa);
      if (success) {
          return res.status(200).json({ mensagem: 'Personalização marcada como completa.' });
      } else {
          return res.status(500).json({ mensagem: 'Erro ao marcar personalização.', erro: error });
      }
  } catch (err) {
      console.error("Erro ao marcar personalização:", err);
      return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
};