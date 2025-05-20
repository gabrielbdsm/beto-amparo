import express from 'express';
import { listarPedidosPorEmpresa } from '../controllers/pedidoController.js';

const router = express.Router();

router.get('/empresa/:slug/pedidos', listarPedidosPorEmpresa);

export default router;
