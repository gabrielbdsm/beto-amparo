import express from 'express';
import {routePrivate}  from '../middleware/sessionEmpresa.js';
import * as empresaController from '../controllers/EmpresaController.js';
import* as AuthController from '../controllers/Empresa/AuthController.js';
const router = express.Router();

router.post('/addEmpresa', AuthController.criarEmpresa);

router.get('/empresa/:id', empresaController.getEmpresaById); 
router.post('/loginEmpresa',AuthController.loginEmpresa)
router.get('/logout', AuthController.logout)

export default router;
