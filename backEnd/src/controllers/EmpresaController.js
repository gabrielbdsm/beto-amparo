import { inserirEmpresa } from '../models/EmpresaModel.js';
import * as empresas from '../models/EmpresaModel.js'

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

<<<<<<< HEAD
export async function postEmpresa(req, res) {
  try {
    const nova = req.body
    console.log(nova)
    const empresa = await empresas.cadastrarEmpresa(nova)
    res.status(201).json(empresa)
  } catch (error) {
    res.status(500).json({ erro: error.message })
  }
}
=======
    if (!nome || !cnpj || !email || !senha) {
      return res.status(400).json({ mensagem: 'Campos obrigatórios ausentes.' });
    }
>>>>>>> 8f521d5042302892255d15876e459427823f3a18

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

export async function getEmpresaById(req, res) {
  try {
    const id = req.params.id
    const empresa = await empresas.buscarEmpresaPorId(id)

    if (!empresa) {
      return res.status(404).json({ erro: 'Empresa não encontrada' })
    }

    res.status(200).json(empresa)
  } catch (error) {
    res.status(500).json({ erro: error.message })
  }
};
