import express from 'express';
import enviarEmailSuporte from '../controllers/suporteController.js';
const router = express.Router();

router.post('/suporte', enviarEmailSuporte);

export default router;
