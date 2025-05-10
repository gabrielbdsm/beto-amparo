import express from 'express';
import supabase from '../config/SupaBase.js';
const router = express.Router();

router.post('/api/carrinho', async (req, res) => {
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
  
router.get('/api/carrinho', async (req, res) => {
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

export default router;