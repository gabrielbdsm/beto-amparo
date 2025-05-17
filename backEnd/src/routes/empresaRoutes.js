import express from 'express';
import supabase from '../config/SupaBase.js';
import * as empresaController from '../controllers/EmpresaController.js';

const router = express.Router();

router.post('/addEmpresa', async (req, res) => {
  try {
    const dados = req.body;
    console.log('Dados recebidos:', dados);

    const { data, error } = await supabase
      .from('empresas') // nome exato da tabela no Supabase
      .insert([dados]);

    if (error) {
      console.error('Erro Supabase:', error);
      return res.status(500).json({ mensagem: 'Erro ao salvar no Supabase', erro: error.message });
    }

    res.status(201).json({ mensagem: 'Empresa cadastrada com sucesso!', data });
  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({ mensagem: 'Erro no servidor.', erro: error.message });
  }
});


export default router;
