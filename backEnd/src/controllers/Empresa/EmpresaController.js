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

export async function getLojaBySlug(req, res) { // Ou a função que sua OwnerSidebar.js chama
  const slug = req.params.slug.toLowerCase();

  try {
      const { data: lojaData, error: lojaError } = await supabase
          .from('loja')
          .select('id, nome_fantasia, foto_loja, is_closed_for_orders, slogan, cor_primaria, cor_secundaria, banner, horarios_funcionamento, ativarFidelidade, slug_loja, id_empresa, mostrar_outras_lojas') 
          .eq('slug_loja', slug)
          .single();

      if (lojaError || !lojaData) {
          console.error('getLojaBySlug: Erro ao buscar loja por slug:', lojaError?.message || 'Loja não encontrada.');
          return res.status(404).json({ mensagem: 'Loja não encontrada.' });
      }

      // Buscar o level_tier da tabela 'empresas' usando o id_empresa da loja
      const { data: empresaData, error: empresaError } = await supabase
          .from('loja')
          .select('level_tier') // Seleciona a nova coluna
          .eq('id', lojaData.id_empresa) // Usa o id_empresa da loja encontrada
          .single();

      if (empresaError && empresaError.code !== 'PGRST116') { // PGRST116 = no rows found
           console.error('getLojaBySlug: Erro ao buscar nível da empresa:', empresaError.message);
      }

      res.status(200).json({
          ...lojaData, // Todos os dados da loja
          level_tier: empresaData ? empresaData.level_tier : 'Nenhum' // Adiciona o level_tier, com fallback
      });

  } catch (err) {
      console.error('getLojaBySlug: Erro inesperado:', err.message, err.stack);
      res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}