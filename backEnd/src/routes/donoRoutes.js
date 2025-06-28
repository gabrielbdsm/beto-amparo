import express from 'express';
import DonoController from '../controllers/Empresa/DonoController.js';

const router = express.Router();

router.get('/dono', DonoController.getDonoData);
router.get('/dono/empresa-id', DonoController.getEmpresaIdFromTokenEndpoint);
router.get('/dono/:slug', DonoController.getDonoData);
router.get('/empresa/minhas-lojas', DonoController.getMinhasLojas);


export default router;
