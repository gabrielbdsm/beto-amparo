import express from 'express';
import { listarPedidosPorEmpresa, criarPedido, adicionarItemPedido, getHistoricoPedidos, getDadosGraficoVendas, getItensDoPedido, listarPedidosPorCliente} from '../controllers/pedidoController.js';


const router = express.Router();

router.get('/loja/:slug/pedidos', listarPedidosPorEmpresa);
router.post('/loja/:slug/pedidos', criarPedido); 
router.post('/loja/:slug/pedidos/item', adicionarItemPedido);
router.get('/pedidos/:idPedido/itens', getItensDoPedido);
router.get('/pedidos/historico/loja/:slugLoja', getHistoricoPedidos);
router.get('/pedidos/grafico/loja/:slugLoja', getDadosGraficoVendas);
router.get('/loja/:slug/pedidos/cliente/:clienteId', listarPedidosPorCliente);

export default router;
