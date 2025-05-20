import express from 'express';
import supabase from '../config/SupaBase.js';
const router = express.Router();

router.post('/carrinho', async (req, res) => {
    const { produtoId, quantidade } = req.body;
  
    if (!produtoId || !quantidade) {
      return res.status(400).json({ erro: 'Produto ID e quantidade são obrigatórios.' });
    }
  
    try {
      console.log('Recebido:', produtoId, quantidade);
  
      const { data, error } = await supabase
        .from('carrinho')
        .insert([
          {
            produto_id: produtoId,
            quantidade,
          },
        ]);
  
      if (error) {
        console.error('Erro do Supabase:', error);
        return res.status(500).json({ erro: 'Erro ao salvar no carrinho.' });
      }
  
      console.log('Dados inseridos:', data);
      res.status(201).json({ mensagem: 'Produto adicionado ao carrinho com sucesso.' });
    } catch (err) {
      console.error('Erro inesperado:', err);
      res.status(500).json({ erro: 'Erro interno ao adicionar ao carrinho.' });
    }
  });
  
router.get('/carrinho', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('carrinho')
      .select(`
        id,
        quantidade,
        produto:produto_id (
          id,
          nome,
          preco,
          image
        )
      `);

    if (error) {
      console.error('Erro ao buscar carrinho:', error);
      return res.status(500).json({ erro: 'Erro ao buscar o carrinho.' });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar o carrinho.' });
  }
});

router.delete('/carrinho/:id', async (req, res) => {
  const { id } = req.params; 

  if (!id) {
    return res.status(400).json({ erro: 'ID do produto é obrigatório.' });
  }

  try {
    console.log('Removendo item com id:', id);

    const { data, error } = await supabase
      .from('carrinho')
      .delete()
      .eq('id', id); 

    if (error) {
      console.error('Erro ao remover item do carrinho:', error);
      return res.status(500).json({ erro: 'Erro ao remover item do carrinho.' });
    }

    console.log('Item removido:', data);
    res.status(200).json({ mensagem: 'Item removido do carrinho com sucesso.' });
  } catch (err) {
    console.error('Erro inesperado:', err);
    res.status(500).json({ erro: 'Erro interno ao remover item do carrinho.' });
  }
});

export default router;