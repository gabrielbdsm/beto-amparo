// backend/routes/lojaRoutes.js
import express from 'express';
// Importe o que vem do personalizacaoController para rotas de personalização (criação/verificação)
import { criarPersonalizacao, verificarSlug } from '../controllers/Empresa/personalizacaoController.js';
// Importe o controller de produtos
import { listarProdutosPorLoja } from '../controllers/produto/ProdutoController.js';
// Importe os middlewares de proteção
import { empresaPrivate, verificarAutenticacaoEmpresa } from '../middleware/protectRouterEmpresa.js';

// Importe AGORA getLojaBySlug do EmpresaController para a rota pública
import { getLojaBySlug } from '../controllers/Empresa/EmpresaController.js'; 
// Importe as outras funções do lojaController (para rotas de gerenciamento interno da loja)
import * as lojaController from '../controllers/Empresa/lojaController.js'; 

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
// Agora, esta rota usa getLojaBySlug que vem do EmpresaController
router.get('/slug/:slug', getLojaBySlug); // <--- AQUI ESTÁ A MUDANÇA PRINCIPAL
router.get('/produtos/loja/:slug', listarProdutosPorLoja);

// Rota para buscar outras lojas da mesma empresa (mantida em lojaController)
router.get('/outras-da-empresa', lojaController.getOutrasLojasDaMesmaEmpresa);

// --- Rotas Privadas (para o Dono da Empresa gerenciar a loja) ---
router.get('/empresa/loja/:slugLoja', empresaPrivate, lojaController.getLojaBySlugAndEmpresaController);

// Rota para alternar o status de aberto/fechado da loja
router.put('/loja/:slugLoja/toggle-status', empresaPrivate, lojaController.toggleLojaStatusController);

// Rota para atualizar os horários de funcionamento da loja
router.put('/loja/:slugLoja/horarios', empresaPrivate, lojaController.updateHorariosFuncionamentoController);

// Rota para atualizar a visibilidade de outras lojas (ADICIONADA AQUI)
router.put('/loja/:slugLoja/visibilidade-outras-lojas', empresaPrivate, lojaController.updateVisibilidadeOutrasLojasController);

// Rota para deletar loja (requer autenticação da empresa)
router.post('/:idLoja/deletar', verificarAutenticacaoEmpresa, lojaController.deletarLoja); 

export default router;