
import express from 'express';
import * as empresaController from '../controllers/EmpresaController.js';

const router = express.Router();

// Definindo as rotas empresa
router.get('/empresas', empresaController.getEmpresas);
router.post('/empresas', empresaController.postEmpresa);
router.put('/empresas/:id', empresaController.putEmpresa);
router.delete('/empresas/:id', empresaController.deleteEmpresa);

export default router;

