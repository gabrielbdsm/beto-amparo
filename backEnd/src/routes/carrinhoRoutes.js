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
  

export default router;
