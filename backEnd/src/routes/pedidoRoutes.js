import express from 'express';
import { listarPedidosPorEmpresa, criarPedido, adicionarItemPedido, finalizarPedido } from '../controllers/pedidoController.js';


const router = express.Router();

router.get('/loja/:slug/pedidos', listarPedidosPorEmpresa);
router.post('/loja/:slug/pedidos', criarPedido); 
router.post('/loja/:slug/pedidos/item', adicionarItemPedido);
router.put('/loja/:slug/pedidos/finalizar', finalizarPedido);

export default router;
