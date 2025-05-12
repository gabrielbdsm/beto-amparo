import { inserirEmpresa } from '../models/EmpresaModel.js';
import * as empresas from '../models/EmpresaModel.js'
import bcrypt from 'bcrypt';
import validarDadosEmpresa from '../validators/EmpresaValidator.js'




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
