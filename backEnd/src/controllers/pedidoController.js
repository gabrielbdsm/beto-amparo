import { buscarPedidosPorSlug } from '../models/PedidoModel.js';

export async function listarPedidosPorEmpresa(req, res) {
  const { slug } = req.params;

  try {
    const pedidos = await buscarPedidosPorSlug(slug);

    if (!pedidos || pedidos.length === 0) {
      return res.status(404).json({ error: 'Nenhum pedido encontrado para esta empresa.' });
    }

    res.json(pedidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar pedidos.' });
  }
}
