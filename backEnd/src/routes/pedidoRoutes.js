import express from 'express';
import { listarPedidosPorEmpresa, criarPedido, adicionarItemPedido, finalizarPedido } from '../controllers/pedidoController.js';
import { authCliente } from '../middleware/authClienteMiddleware.js';


const router = express.Router();

router.post('/loja/:slug/pedidos', authCliente, criarPedido); 
router.post('/loja/:slug/pedidos/item', authCliente, adicionarItemPedido);
router.put('/loja/:slug/pedidos/finalizar', authCliente, finalizarPedido);
router.get('/loja/:slug/pedidos', listarPedidosPorEmpresa); 

export default router;
