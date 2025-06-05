import express from 'express';
import DonoController from '../controllers/Empresa/DonoController.js';

const router = express.Router();

router.get('/dono', DonoController.getDonoData);
router.get('/empresa/:nomeEmpresa/lojas', DonoController.getLojaPorNomeEmpresa);

export default router;
