import * as produto from '../models/ProdutoModel.js'
import { validarProduto } from '../validators/ProdutoValidators.js'
export const criarProduto = async (req, res) => {
  try {
    const {
      nome,
      categoria,
      novaCategoria,
      novaCategoriaTexto,
      image,
      preco,
      descricao
    } = req.body

      const validacao = validarProduto({
      nome,
      categoria,
      novaCategoria,
      novaCategoriaTexto,
      image : "fa",
      preco,
      descricao
    });
    
    if (!validacao.valido) {

      return res.status(400).json({ mensagem: validacao.erros[0]});
    }

    const categoriaFinal = novaCategoria ? novaCategoriaTexto : categoria
    const id = 1 // Muda futuramente para UUID da empresa

    const { error } = await produto.inserirProduto({
      id_empresa: id,
      nome,
     image: "vfd",
      categoria: categoriaFinal,
      preco,
      descricao
    })

    if (error) {
      return res.status(500).json({ mensagem: 'Erro ao inserir produto.', erro: error })
    }

    return res.status(201).json({
      mensagem: 'Produto criado com sucesso.',
     
    })
  } catch (erro) {
   
    return res.status(500).json({
      mensagem: 'Erro inesperado no servidor.',
      erro: erro.message
    })
  }
}

export const getProdutos = async (req, res) => {
  try {
    const { data, error } = await produto.listarProdutos()
    if (error) {
      return res.status(500).json({ erro: error })
    }
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ erro: error.message })
  }
}

export const atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params
    const camposAtualizados = req.body

    if (!id) {
      return res.status(400).json({ mensagem: 'ID do produto não fornecido.' })
    }

    const { error } = await produto.atualizarProduto(id, camposAtualizados)

    if (error) {
      return res.status(500).json({ mensagem: 'Erro ao atualizar o produto.', erro: error })
    }

    return res.status(200).json({
      mensagem: 'Produto atualizado com sucesso.'
    })
  } catch (erro) {
    return res.status(500).json({
      mensagem: 'Erro inesperado ao atualizar o produto.',
      erro: erro.message
    })
  }
}

export const deletarProduto = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ mensagem: 'ID do produto não fornecido.' })
    }

    const { error } = await produto.deletarProduto(id)

    if (error) {
      return res.status(500).json({ mensagem: 'Erro ao deletar o produto.', erro: error })
    }

    return res.status(200).json({
      mensagem: 'Produto deletado com sucesso.'
    })
  } catch (erro) {
    return res.status(500).json({
      mensagem: 'Erro inesperado ao deletar o produto.',
      erro: erro.message
    })
  }
}

export const listarProdutoPorId = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ mensagem: 'ID do produto não fornecido.' })
    }

    const { data, error } = await produto.listarProdutoPorId(id)

    if (error) {
      return res.status(500).json({ mensagem: 'Erro ao listar o produto.', erro: error })
    }
    if (data.length === 0) {
      return res.status(404).json({ mensagem: 'Produto não encontrado.' })
    }
    return res.status(200).json({
      mensagem: 'Produto listado com sucesso.',
      produto: data[0]
    })
  } catch (erro) {
    return res.status(500).json({
      mensagem: 'Erro inesperado ao listar o produto.',
      erro: erro.message
    })
  }
}
