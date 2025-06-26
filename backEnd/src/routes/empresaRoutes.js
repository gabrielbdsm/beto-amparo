// backend/routes/empresaRoutes.js
import express from 'express';
import * as AuthController from '../controllers/Empresa/AuthController.js'; // <-- CORRIGIDO AQUI!
import * as EmpresaModel from '../models/EmpresaModel.js';
import { routePrivate } from '../middleware/protectRoutes.js';
import * as EmpresaController from '../controllers/Empresa/EmpresaController.js'; 

import { atualizarPersonalizacao, criarPersonalizacao, getLojaBySlug, verificarSlug  } from '../controllers/Empresa/personalizacaoController.js';
import * as HorariosController from '../controllers/Empresa/horariosCotroller.js'; 
import * as agendamentoEmpresaController from '../controllers/Empresa/AgendamentoEmpresaController.js'; // <-- CORRIGIDO AQUI!
import { empresaPrivate } from '../middleware/protectRouterEmpresa.js'; // <-- CORRIGIDO AQUI!
import * as insightController from "../controllers/Empresa/insightController.js"

const router = express.Router();

import { enviarEmailRecuperacao } from '../controllers/recuperarSenhaController.js';
import { definirNovaSenha } from '../controllers/redefinirSenhaController.js';

router.post('/recuperar-senha',enviarEmailRecuperacao);
router.post('/nova-senha', definirNovaSenha);

router.put('/empresa/personalizacao/:slug', atualizarPersonalizacao);
router.post('/empresa/personalizacao', criarPersonalizacao);
router.get('/empresa/personalizacao/:slug', getLojaBySlug);
router.get('/empresa/verificar-slug', verificarSlug);

router.post('/addEmpresa', AuthController.criarEmpresa);
router.post('/loginEmpresa', AuthController.loginEmpresa);

router.post('/logout', AuthController.logout);

router.get('/logout', AuthController.logout);
router.get('/empresa/horarios/:slug',empresaPrivate, HorariosController.getDatasConfiguradasByEmpresa);
router.post('/empresa/horarios/:slug',empresaPrivate, HorariosController.saveDatasConfiguradas);
router.delete('/empresa/horarios/:data/:slug',empresaPrivate, HorariosController.deleteDataConfigurada);

router.get('/empresa/agendamentos/:slug', empresaPrivate, agendamentoEmpresaController.getAgendamentosController);
router.delete('/empresa/agendamentos/:slug', empresaPrivate, agendamentoEmpresaController.deleteAgendamentoController);
router.put('/empresa/agendamentos/:slug', empresaPrivate, agendamentoEmpresaController.updateAgendamentoController);
router.get('/loja/slug-completo/:slug', EmpresaController.BuscarEmpresaBySlug);


router.get('/empresa/insights/:slug', insightController.buscarInsightsPorSlug);

router.get('/verificar-sessao', AuthController.verificarSessao);


router.get('/verifyAuthStatus', routePrivate, (req, res) => {
  // Se o middleware routePrivate passou, significa que o usuário está autenticado
  res.status(200).json({ mensagem: 'Autenticado.' });
});
router.put('/marcar-personalizacao-completa', routePrivate, EmpresaController.marcarPersonalizacaoCompleta);

router.get('/empresa/dashboard/nome/:slug', async (req, res) => {
  const { slug } = req.params;

  try {
    const { data: lojaData, error: modelError } = await EmpresaModel.findNomeFantasiaBySlug(slug);

    if (modelError || !lojaData) {
      return res.status(404).json({ message: "Loja não encontrada para este slug." });
    }

    res.status(200).json({ nome_fantasia: lojaData.nome_fantasia });
  } catch (err) {
    console.error("Controller Error: Erro no endpoint /empresa/dashboard/nome/:slug:", err);
    res.status(500).json({ message: "Erro interno do servidor ao buscar nome da loja para o painel." });
  }
});

export default router;