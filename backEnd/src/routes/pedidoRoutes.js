import express from 'express';
import { listarPedidosPorEmpresa, criarPedido, adicionarItemPedido, finalizarPedido, obterPedidoPorId } from '../controllers/pedidoController.js';
import { authCliente } from '../middleware/authClienteMiddleware.js';


const router = express.Router();

router.post('/loja/:slug/pedidos', authCliente, criarPedido);
router.post('/loja/:slug/pedidos/item', authCliente, adicionarItemPedido);
router.put('/loja/:slug/pedidos/finalizar', authCliente, finalizarPedido);
router.get('/loja/:slug/pedidos', listarPedidosPorEmpresa);
router.get('/loja/:slug/pedidos/:pedidoId', authCliente, obterPedidoPorId);

export default router;
