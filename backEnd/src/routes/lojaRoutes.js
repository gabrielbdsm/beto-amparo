import express from 'express';
import { criarPersonalizacao, verificarSlug , getLojaBySlug } from '../controllers/Empresa/personalizacaoController.js';
import { listarProdutosPorLoja } from '../controllers/produto/ProdutoController.js';
import { empresaPrivate } from '../middleware/protectRouterEmpresa.js';
import * as lojaController from '../controllers/Empresa/lojaController.js';
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
router.get('/slug/:slug', getLojaBySlug);
router.get('/produtos/loja/:slug', listarProdutosPorLoja); // Mantenha esta como sua rota original
router.get('/empresa/loja/:slugLoja', empresaPrivate ,  lojaController.getLojaBySlugAndEmpresaController);
router.put('/loja/:slugLoja/toggle-status', empresaPrivate, lojaController.toggleLojaStatusController);
export default router;