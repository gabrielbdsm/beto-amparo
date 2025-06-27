import { inserirEmpresa } from '../../models/EmpresaModel.js';
import * as empresas from '../../models/EmpresaModel.js';
import supabase from '../../config/SupaBase.js';
import * as LojaModel from '../../models/Loja.js';

export async function getEmpresaBySlug(req, res) {
  const slug = req.params.slug.toLowerCase(); 

  try {
    const { data, error } = await supabase
      .from('loja')
      .select('id_empresa, nome_fantasia, foto_loja')
      .eq('slug_loja', slug)
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

export const listarLojasPorEmpresaSlug = async (req, res) => {
  // O ID da empresa já estará disponível em req.IdEmpresa graças ao middleware 'empresaPrivate'
  const empresaId = req.IdEmpresa;
  const empresaSlug = req.params.empresaSlug; // Captura o slug da URL

  console.log(`DEBUG: [EmpresaController.listarLojasPorEmpresaSlug] Buscando lojas para empresa ID: ${empresaId} com slug: ${empresaSlug}`);

  try {
    const { data: lojas, error } = await LojaModel.buscarLojasPorEmpresaId(empresaId);

    if (error) {
      console.error("Erro ao buscar lojas no modelo:", error);
      return res.status(500).json({ message: "Erro interno do servidor ao buscar lojas." });
    }
    // req.user já tem os dados da empresa logada
    const empresaInfo = {
      id: req.user.id,
      nome: req.user.nome,
      site: req.user.site,
      // Adicione outras propriedades da empresa que você queira enviar para o frontend
    };

    return res.status(200).json({
      lojas: lojas || [], // Garante que sempre retorna um array
      empresa: empresaInfo
    });

  } catch (err) {
    console.error("Erro inesperado no controller listarLojasPorEmpresaSlug:", err);
    return res.status(500).json({ message: "Erro inesperado do servidor." });
  }
};

export async function BuscarEmpresaBySlug(req, res) {
  const slug = req.params.slug.toLowerCase(); 

  try {
    // Busca a 'loja' e faz o JOIN implícito para trazer a 'empresa' junto
    const { data: lojaData, error } = await supabase
      .from('loja')
      .select(`
        *,
        empresas: id_empresa(*)
      `)
      .eq('slug_loja', slug)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Código para "Não encontrado"
        return res.status(404).json({ erro: 'Loja não encontrada.' });
      }
      throw error; // Lança outros erros do Supabase
    }

    const empresaData = lojaData.empresas;

    if (!empresaData) {
      return res.status(404).json({ erro: 'Dados da empresa associada não encontrados.' });
    }
    
    // Remove o objeto aninhado para evitar redundância
    delete lojaData.empresas;

    // Retorna o JSON no formato exato que o frontend espera: { loja: {...}, empresa: {...} }
    res.status(200).json({
      loja: lojaData,
      empresa: empresaData // Aqui dentro estão o telefone, email, etc.
    });
    
  } catch (err) {
    console.error("Erro ao buscar dados completos da loja:", err.message);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}