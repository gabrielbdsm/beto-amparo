import * as empresas from '../models/EmpresaModel.js'

export async function getEmpresas(req, res) {
  try {
    const empresasList = await empresas.listarEmpresas()
    res.status(200).json(empresasList)
  } catch (error) {
    res.status(500).json({ erro: error.message })
  }
}

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

export async function putEmpresa(req, res) {
  try {
    const id = req.params.id
    const dados = req.body
    const empresa = await empresas.atualizarEmpresa(id, dados)
    res.status(200).json(empresa)
  } catch (error) {
    res.status(500).json({ erro: error.message })
  }
}

export async function deleteEmpresa(req, res) {
  try {
    const id = req.params.id
    const empresa = await empresas.deletarEmpresa(id)
    res.status(200).json(empresa)
  } catch (error) {
    res.status(500).json({ erro: error.message })
  }
}
