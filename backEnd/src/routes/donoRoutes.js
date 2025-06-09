import express from 'express';
import DonoController from '../controllers/Empresa/DonoController.js';

const router = express.Router();

<<<<<<< HEAD
router.get('/dono', DonoController.getDonoData);
router.get('/dono/empresa-id', DonoController.getEmpresaIdFromTokenEndpoint);
=======
router.get('/dono/:slug', DonoController.getDonoData);

>>>>>>> 3df95ff4e293d782bbd06c8a2c6fef9b74deef8d
export default router;
