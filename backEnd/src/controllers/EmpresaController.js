import { inserirEmpresa } from '../models/EmpresaModel.js';
import * as empresas from '../models/EmpresaModel.js'
import bcrypt from 'bcrypt';
import validarDadosEmpresa from '../validators/EmpresaValidator.js'




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
