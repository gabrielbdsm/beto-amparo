import * as produto from '../models/ProdutoModel.js';
import { validarProduto } from '../validators/ProdutoValidators.js';
import * as ImageModel from '../models/ImageModel.js';
export const criarProduto = async (req, res) => {
  try {
   console.log('req.body', req.body); 
    const {
      nome,
      categoria,
      novaCategoria,
      novaCategoriaTexto,
      preco,
      descricao,
      tamanhos,
      controlar_estoque,
      quantidade,
    } = req.body;

    const imagem = req.file 
    // Converter dados do FormData
    const tamanhosParsed = tamanhos ? JSON.parse(tamanhos) : [];
    const controlarEstoque = controlar_estoque === 'true';
    const quantidadeParsed = controlarEstoque ? parseInt(quantidade, 10) || 0 : 0;
    if (!imagem) return res.status(400).json({ error: "Imagem não enviada" });

  
    const validacao = validarProduto({
      nome,
      categoria: novaCategoria === 'true' ? novaCategoriaTexto : categoria,
      preco: parseFloat(preco),
      descricao,
      quantidade: quantidadeParsed,
    });

    if (!validacao.valido) {
      return res.status(400).json({ mensagem: validacao.erros[0] });
    }

    
    const categoriaFinal = novaCategoria === 'true' ? novaCategoriaTexto : categoria;
    const UUID = 1; // Muda futuramente para UUID da empresa

    const URlimagem = await ImageModel.salvarImagem(imagem.buffer, imagem.originalname, imagem.mimetype, UUID);

    if (!URlimagem) {
      return res.status(500).json({ mensagem: 'Erro ao salvar imagem.' });
    }
    const { error } = await produto.inserirProduto({
      UUID,
      nome,
      image: URlimagem, 
      categoria: categoriaFinal,
      preco: parseFloat(preco),
      descricao,
      tamanhos: tamanhosParsed,
      controlarEstoque,
      quantidade: quantidadeParsed,
    });

    if (error) {
      return res.status(500).json({ mensagem: 'Erro ao inserir produto.', erro: error });
    }

    return res.status(201).json({
      mensagem: 'Produto criado com sucesso.',
    });
  } catch (erro) {
    console.error('Erro no controlador criarProduto:', erro);
    return res.status(500).json({
      mensagem: 'Erro inesperado no servidor.',
      erro: erro.message,
    });
  }
};

export const getProdutos = async (req, res) => {
  try {
    const { data, error } = await produto.listarProdutos();
    if (error) {
      return res.status(500).json({ erro: error });
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
};

export const atualizarProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const camposAtualizados = req.body;

    if (!id) {
      return res.status(400).json({ mensagem: 'ID do produto não fornecido.' });
    }

    const { error } = await produto.atualizarProduto(id, camposAtualizados);

    if (error) {
      return res.status(500).json({ mensagem: 'Erro ao atualizar o produto.', erro: error });
    }

    return res.status(200).json({
      mensagem: 'Produto atualizado com sucesso.',
    });
  } catch (erro) {
    return res.status(500).json({
      mensagem: 'Erro inesperado ao atualizar o produto.',
      erro: erro.message,
    });
  }
};

export const deletarProduto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ mensagem: 'ID do produto não fornecido.' });
    }

    const { error } = await produto.deletarProduto(id);

    if (error) {
      return res.status(500).json({ mensagem: 'Erro ao deletar o produto.', erro: error });
    }

    return res.status(200).json({
      mensagem: 'Produto deletado com sucesso.',
    });
  } catch (erro) {
    return res.status(500).json({
      mensagem: 'Erro inesperado ao deletar o produto.',
      erro: erro.message,
    });
  }
};

export const listarProdutoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ mensagem: 'ID do produto não fornecido.' });
    }

    const { data, error } = await produto.listarProdutoPorId(id);

    if (error) {
      return res.status(500).json({ mensagem: 'Erro ao listar o produto.', erro: error });
    }
    if (data.length === 0) {
      return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    }
    return res.status(200).json({
      mensagem: 'Produto listado com sucesso.',
      produto: data[0],
    });
  } catch (erro) {
    return res.status(500).json({
      mensagem: 'Erro inesperado ao listar o produto.',
      erro: erro.message,
    });
  }
};

export const listarProdutosPorEmpresa = async (req, res) => {
  try {
    const { empresaId } = req.params;

    if (!empresaId) {
      return res.status(400).json({ mensagem: "ID da empresa não fornecido." });
    }

    // Buscar produtos pelo ID da empresa
    const { data, error } = await produto.listarProdutosPorEmpresa(empresaId);

    if (error) {
      return res.status(500).json({ mensagem: "Erro ao listar produtos.", erro: error });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ mensagem: "Nenhum produto encontrado para esta empresa." });
    }

    return res.status(200).json(data);
  } catch (erro) {
    return res.status(500).json({
      mensagem: "Erro inesperado ao listar produtos.",
      erro: erro.message,
    });
  }
};