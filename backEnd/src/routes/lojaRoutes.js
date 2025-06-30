// backend/routes/lojaRoutes.js
import express from 'express';

// Importações do personalizacaoController (criação/verificação de slug)
import { criarPersonalizacao, verificarSlug, getLojaBySlug } from '../controllers/Empresa/personalizacaoController.js'; // getLojaBySlug do personalizacaoController

// Importe o controller de produtos
import { listarProdutosPorLoja } from '../controllers/produto/ProdutoController.js';

// Importe os middlewares de proteção
import { empresaPrivate } from '../middleware/protectRouterEmpresa.js'; // Apenas empresaPrivate

// Importe outras funções do lojaController (para rotas de gerenciamento interno da loja)
import * as lojaController from '../controllers/Empresa/lojaController.js'; 

// Importe o controller de recomendações (do develop)
import { buscarRecomendacoes } from '../controllers/recomendacaoController.js';


const router = express.Router();

// Rota GET de teste
router.get('/', (req, res) => {
    res.send('Rota da loja funcionando!');
});

// Rota GET de produtos (exemplo) - se é um mock, remova
router.get('/produtos', (req, res) => {
    res.json([
        { id: 1, nome: 'Produto A' },
        { id: 2, nome: 'Produto B' },
    ]);
});

// --- Rotas de Personalização (Dashboard da Empresa) ---
// Essas rotas lidam com a criação/atualização de personalização
router.post('/personalizacao', criarPersonalizacao); // Criar personalização da loja
router.get('/check-slug', verificarSlug); // Verificar disponibilidade de slug

// --- Rotas Públicas (para o Cliente ver a loja e seus dados) ---
// Esta rota usa getLojaBySlug que vem do personalizacaoController
router.get('/slug/:slug', getLojaBySlug); 
router.get('/produtos/loja/:slug', listarProdutosPorLoja);

// Rota para buscar outras lojas da mesma empresa (mantida em lojaController)
router.get('/outras-da-empresa', lojaController.getOutrasLojasDaMesmaEmpresa);

// --- Rotas Privadas (para o Dono da Empresa gerenciar a loja) ---
router.get('/empresa/loja/:slugLoja', empresaPrivate, lojaController.getLojaBySlugAndEmpresaController);

// Rota para alternar o status de aberto/fechado da loja
router.put('/loja/:slugLoja/toggle-status', empresaPrivate, lojaController.toggleLojaStatusController);

// Rota para atualizar os horários de funcionamento da loja (do HEAD)
router.put('/loja/:slugLoja/horarios', empresaPrivate, lojaController.updateHorariosFuncionamentoController);

// Rota para atualizar a visibilidade de outras lojas (do HEAD)
router.put('/loja/:slugLoja/visibilidade-outras-lojas', empresaPrivate, lojaController.updateVisibilidadeOutrasLojasController);

// Rota para deletar loja (do HEAD, usando empresaPrivate para consistência)
router.post('/:idLoja/deletar', empresaPrivate, lojaController.deletarLoja); 

// Rota para buscar recomendações (do develop)
router.get('/:slug/recomendacoes', buscarRecomendacoes);

export default router;