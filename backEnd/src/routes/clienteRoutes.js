// src/routes/clienteRoutes.js
import express from 'express';
import clienteController from '../controllers/client/clienteController.js';
import * as AuthClinteController from "../controllers/client/AuthClinteController.js";


const router = express.Router();

router.use((req, res, next) => {
  console.log(`Recebida requisição para: ${req.method} ${req.path}`);
  next();
});

router.get('/clientes', clienteController.listar);
router.get('/clientes/:id', clienteController.obterPorId);
router.put('/clientes/:id', clienteController.atualizar); 
router.delete('/clientes/:id', clienteController.remover);

router.use((req, res, next) => {
  console.log(`Recebida requisição para: ${req.method} ${req.path}`);
  next();
});


router.post('/login', AuthClinteController.login); 
router.post('/clientes', AuthClinteController.cadastrar); 
router.get('/clientLogout', AuthClinteController.logout);


export default router;
