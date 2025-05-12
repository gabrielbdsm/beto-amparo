import { inserirEmpresa } from '../models/EmpresaModel.js';
import * as empresas from '../models/EmpresaModel.js'
import supabase from '../config/SupaBase.js';

export const criarEmpresa = async (req, res) => {
  try {
    const {
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
    } = req.body;

async function postEmpresa(req, res) {
  try {
    const nova = req.body
    console.log(nova)
    const empresa = await empresas.cadastrarEmpresa(nova)
    res.status(201).json(empresa)
  } catch (error) {
    res.status(500).json({ erro: error.message })
  }
}

    const { error } = await inserirEmpresa({
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
    });

    if (error) {
      return res.status(500).json({ mensagem: error });
    }

    return res.status(201).json({ mensagem: 'Empresa cadastrada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ mensagem: 'Erro no servidor.' });
  }
};

export async function getEmpresaBySlug(req, res) {
  const { slug } = req.params;

  try {
    const { data: loja, error: erroLoja } = await supabase
      .from('loja')
      .select('id_empresa, nome_fantasia, foto_loja')
      .eq('slug_loja', slug)
      .single();

    if (erroLoja || !loja) {
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    const empresa = await empresas.buscarEmpresaPorId(loja.id_empresa);

    if (!empresa) {
      return res.status(404).json({ erro: 'Empresa não encontrada' });
    }

    res.status(200).json({
      ...empresa,
      nome_fantasia: loja.nome_fantasia,
      foto_loja: loja.foto_loja
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}
