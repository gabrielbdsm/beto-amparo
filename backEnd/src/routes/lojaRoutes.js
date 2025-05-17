import express from 'express';
import { criarPersonalizacao, verificarSlug, getLojaBySlug } from '../controllers/personalizacaoController.js';

const router = express.Router();

// Rota GET de teste
router.get('/', (req, res) => {
  res.send('Rota da loja funcionando!');
});

// Rota GET de produtos (exemplo)
router.get('/produtos', (req, res) => {
  res.json([
    { id: 1, nome: 'Produto A' },
    { id: 2, nome: 'Produto B' },
  ]);
});

// Rota POST para personalização
router.post('/personalizacao', criarPersonalizacao);

// Rota GET para verificar disponibilidade de slug
router.get('/check-slug', verificarSlug);
router.get('/loja/slug/:slug', getLojaBySlug);

export default router;