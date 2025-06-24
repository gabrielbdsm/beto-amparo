import supabase from '../config/SupaBase.js';

async function getRecomendacoes(slug, clienteId) {
    const { data: loja, error: lojaError } = await supabase
        .from('loja')
        .select('id')
        .eq('slug_loja', slug)
        .single();

    if (lojaError || !loja) {
        throw new Error('Loja não encontrada.');
    }
    const lojaId = loja.id;

    let recommendedProductIds = [];
    let purchasedProductIds = new Set();

    if (clienteId) {
        const { data: pedidosDoCliente } = await supabase.from('pedidos').select('id').eq('id_cliente', clienteId).eq('id_loja', lojaId);
        if (pedidosDoCliente && pedidosDoCliente.length > 0) {
            const pedidoIds = pedidosDoCliente.map(p => p.id);
            const { data: itensComprados } = await supabase.from('pedido_itens').select('produto_id').in('pedido_id', pedidoIds);
            itensComprados.forEach(item => purchasedProductIds.add(item.produto_id));
            const { data: produtosComprados } = await supabase.from('produto').select('categoria_id').in('id', Array.from(purchasedProductIds));
            const categoriasDeInteresse = [...new Set(produtosComprados.map(p => p.categoria_id).filter(Boolean))];
            if (categoriasDeInteresse.length > 0) {
                const { data: produtosSugeridos } = await supabase.from('produto').select('id').eq('id_loja', lojaId).in('categoria_id', categoriasDeInteresse);
                recommendedProductIds = produtosSugeridos.map(p => p.id).filter(id => !purchasedProductIds.has(id));
            }
        }
    }

    if (recommendedProductIds.length === 0) {
        const { data: todosPedidosDaLoja } = await supabase.from('pedidos').select('id').eq('id_loja', lojaId).eq('status', 'finalizado');
        if (todosPedidosDaLoja && todosPedidosDaLoja.length > 0) {
            const todosPedidoIds = todosPedidosDaLoja.map(p => p.id);
            const { data: todosItensVendidos } = await supabase.from('pedido_itens').select('produto_id, quantidade').in('pedido_id', todosPedidoIds);
            const salesCount = {};
            for (const item of todosItensVendidos) {
                salesCount[item.produto_id] = (salesCount[item.produto_id] || 0) + item.quantidade;
            }
            const sortedProducts = Object.entries(salesCount).sort((a, b) => b[1] - a[1]);
            recommendedProductIds = sortedProducts.map(p => parseInt(p[0])).filter(id => !purchasedProductIds.has(id));
        }
    }

    const finalProductIds = recommendedProductIds.slice(0, 10);
    if (finalProductIds.length === 0) return [];

    const { data: finalProducts, error: finalProductsError } = await supabase.from('produto').select('*').in('id', finalProductIds).eq('ativo', true);
    if (finalProductsError) throw new Error('Erro ao buscar detalhes dos produtos.');

    const availableProducts = finalProducts.filter(p => p.controlar_estoque ? p.quantidade > 0 : true);
    
    // O model retorna os dados puros.
    return availableProducts;
}

// Exporta a função para ser usada pelo Controller
export {
    getRecomendacoes,
};