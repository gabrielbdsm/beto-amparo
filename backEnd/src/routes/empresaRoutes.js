// backend/routes/empresaRoutes.js
import express from 'express';
import * as AuthController from '../controllers/Empresa/AuthController.js'; // <-- CORRIGIDO AQUI!
import * as EmpresaModel from '../models/EmpresaModel.js';
import { routePrivate } from '../middleware/protectRoutes.js';
import * as EmpresaController from '../controllers/Empresa/EmpresaController.js';

//conflito e essa é a versão atual
/*
import { atualizarPersonalizacao, criarPersonalizacao, getLojaBySlug, verificarSlug } from '../controllers/Empresa/personalizacaoController.js';
import * as HorariosController from '../controllers/Empresa/horariosCotroller.js';
*/
//essa é a outra, e n vou me arriscar tirar daq

import { atualizarPersonalizacao, criarPersonalizacao, getLojaBySlug, verificarSlug  } from '../controllers/Empresa/personalizacaoController.js';
import * as HorariosController from '../controllers/Empresa/horariosCotroller.js'; 
import * as agendamentoEmpresaController from '../controllers/Empresa/AgendamentoEmpresaController.js'; // <-- CORRIGIDO AQUI!

import { empresaPrivate } from '../middleware/protectRouterEmpresa.js'; // <-- CORRIGIDO AQUI!

//import { empresaPrivate } from './protectRoutesEmpresa'; //tentando autenticar pag de loja

const router = express.Router();

import { enviarEmailRecuperacao } from '../controllers/recuperarSenhaController.js';
import { definirNovaSenha } from '../controllers/redefinirSenhaController.js';

router.post('/recuperar-senha', enviarEmailRecuperacao);
router.post('/nova-senha', definirNovaSenha);

router.put('/empresa/personalizacao/:slug', atualizarPersonalizacao);
router.post('/empresa/personalizacao', criarPersonalizacao);
router.get('/empresa/personalizacao/:slug', getLojaBySlug);
router.get('/empresa/verificar-slug', verificarSlug);

router.post('/addEmpresa', AuthController.criarEmpresa);
router.post('/loginEmpresa', AuthController.loginEmpresa);

router.post('/logout', AuthController.logout);

router.get('/logout', AuthController.logout);
router.get('/empresa/horarios', empresaPrivate, HorariosController.getDatasConfiguradasByEmpresa);
router.post('/empresa/horarios', empresaPrivate, HorariosController.saveDatasConfiguradas);
router.delete('/empresa/horarios/:data', empresaPrivate, HorariosController.deleteDataConfigurada);

router.get('/empresa/agendamentos', empresaPrivate, agendamentoEmpresaController.getAgendamentosController);
router.delete('/empresa/agendamentos', empresaPrivate, agendamentoEmpresaController.deleteAgendamentoController);
router.put('/empresa/agendamentos', empresaPrivate, agendamentoEmpresaController.updateAgendamentoController);



router.get('/verifyAuthStatus', routePrivate, (req, res) => {
  // Se o middleware routePrivate passou, significa que o usuário está autenticado
  res.status(200).json({ mensagem: 'Autenticado.' });
});

//autenticacao de loja
router.get('/:empresaSlug/validate', empresaPrivate, (req, res) => {
  res.status(200).json({
    authenticated: true,
    empresa_slug: req.user.slug,
    empresa_id: req.IdEmpresa,
    nome_empresa: req.user.nome
  });
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