import express from 'express';
<<<<<<< HEAD
import { listarPedidosPorEmpresa, criarPedido, adicionarItemPedido, finalizarPedido, obterPedidoPorId } from '../controllers/pedidoController.js';
import { authCliente } from '../middleware/authClienteMiddleware.js';
=======
import { listarPedidosPorEmpresa, criarPedido, adicionarItemPedido, getHistoricoPedidos, getDadosGraficoVendas, getItensDoPedido, listarPedidosPorCliente} from '../controllers/pedidoController.js';
>>>>>>> develop


const router = express.Router();

router.post('/loja/:slug/pedidos', authCliente, criarPedido);
router.post('/loja/:slug/pedidos/item', authCliente, adicionarItemPedido);
router.put('/loja/:slug/pedidos/finalizar', authCliente, finalizarPedido);
router.get('/loja/:slug/pedidos', listarPedidosPorEmpresa);
<<<<<<< HEAD
router.get('/loja/:slug/pedidos/:pedidoId', authCliente, obterPedidoPorId);
=======
router.post('/loja/:slug/pedidos', criarPedido); 
router.post('/loja/:slug/pedidos/item', adicionarItemPedido);
router.get('/pedidos/:idPedido/itens', getItensDoPedido);
router.get('/pedidos/historico/loja/:slugLoja', getHistoricoPedidos);
router.get('/pedidos/grafico/loja/:slugLoja', getDadosGraficoVendas);
router.get('/loja/:slug/pedidos/cliente/:clienteId', listarPedidosPorCliente);
>>>>>>> develop

export default router;
