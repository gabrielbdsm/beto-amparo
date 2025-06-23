// backend/cron/missionCronJobs.js
import supabase from '../src/config/SupaBase.js'; // Ajuste o caminho se necessário
import { trackMissionProgress } from '../services/missionTrackerService.js'; // Ajuste o caminho se necessário

// Função para calcular faturamento semanal e rastrear missão (Já funcionando!)
export async function checkWeeklyRevenue() {
    console.log('CRON: Iniciando verificação de Faturamento Semanal...');

    const now = new Date();
    const offsetPalmas = -3 * 60; 
    const nowLocal = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + offsetPalmas * 60000);

    const startOfWeek = new Date(nowLocal);
    startOfWeek.setDate(nowLocal.getDate() - nowLocal.getDay() - 7); 
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); 
    endOfWeek.setHours(23, 59, 59, 999);

    console.log(`CRON: Período Semanal (última semana): ${startOfWeek.toISOString().split('T')[0]} a ${endOfWeek.toISOString().split('T')[0]}`);

    const { data: lojas, error: lojasError } = await supabase
        .from('loja')
        .select('id, id_empresa') 
        .not('id_empresa', 'is', null); 

    if (lojasError) {
        console.error('CRON ERROR: Erro ao buscar lojas para faturamento semanal:', lojasError.message);
        return;
    }

    for (const loja of lojas) {
        console.log(`CRON: Processando loja ${loja.id} (Owner ID: ${loja.id_empresa}) para Faturamento Semanal.`);
        
        const { data: pedidos, error: pedidosError } = await supabase
            .from('pedidos') 
            .select('total') 
            .eq('id_loja', loja.id)
            .gte('data', startOfWeek.toISOString()) 
            .lte('data', endOfWeek.toISOString())   
            .eq('status', 4); 

        if (pedidosError) {
            console.error(`CRON ERROR: Erro ao buscar pedidos para loja ${loja.id} (semanal):`, pedidosError.message);
            continue;
        }

        const totalFaturamento = pedidos.reduce((sum, pedido) => sum + pedido.total, 0);
        console.log(`CRON: Loja ${loja.id}: Faturamento Semanal: R$${totalFaturamento}`);

        await trackMissionProgress(loja.id, 'weekly_revenue', totalFaturamento, { ownerId: loja.id_empresa });
    }
    console.log('CRON: Finalizado verificação de Faturamento Semanal.');
}

// --- Funçao checkBestSellingProduct() - CORRIGIDA! ---
export async function checkBestSellingProduct() {
    console.log('CRON: Iniciando verificação de Produto Mais Vendido (Mensal)...');

    const now = new Date();
    const offsetPalmas = -3 * 60; 
    const nowLocal = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + offsetPalmas * 60000);

    const startOfMonth = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), 1); 
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(nowLocal.getFullYear(), nowLocal.getMonth() + 1, 0); 
    endOfMonth.setHours(23, 59, 59, 999);

    console.log(`CRON: Período Mensal: ${startOfMonth.toISOString().split('T')[0]} a ${endOfMonth.toISOString().split('T')[0]}`);

    const { data: missionDef, error: missionDefError } = await supabase
        .from('achievements')
        .select('goal')
        .eq('type', 'best_selling_product')
        .single();

    const missionGoal = missionDef ? missionDef.goal : 20; 

    if (missionDefError) {
        console.error('CRON ERROR: Erro ao buscar meta da missão "Mais Vendido":', missionDefError.message);
    }

    const { data: lojas, error: lojasError } = await supabase
        .from('loja')
        .select('id, id_empresa') 
        .not('id_empresa', 'is', null); 

    if (lojasError) {
        console.error('CRON ERROR: Erro ao buscar lojas para produto mais vendido:', lojasError.message);
        return;
    }

    for (const loja of lojas) {
        console.log(`CRON: Processando loja ${loja.id} (Owner ID: ${loja.id_empresa}) para Produto Mais Vendido.`);
        
        const { data: itensVendidos, error: itensError } = await supabase
            .from('pedido_itens')
            .select(`
                quantidade,
                produto_id,
                pedidos!inner(id, id_loja, data, status) -- <-- CORREÇÃO: 'id_loja' AQUI NO JOIN!
            `)
            .eq('pedidos.id_loja', loja.id) 
            .eq('pedidos.status', 4) 
            .gte('pedidos.data', startOfMonth.toISOString()) 
            .lte('pedidos.data', endOfMonth.toISOString());

        if (itensError) {
            console.error(`CRON ERROR: Erro ao buscar itens vendidos para loja ${loja.id} (mensal):`, itensError.message);
            continue;
        }

        const productSales = {};
        for (const item of itensVendidos) {
            productSales[item.produto_id] = (productSales[item.produto_id] || 0) + item.quantidade;
        }

        let maxSoldUnits = 0; 
        let bestSellingProductId = null; 

        for (const productId in productSales) {
            if (productSales[productId] > maxSoldUnits) {
                maxSoldUnits = productSales[productId];
                bestSellingProductId = productId;
            }
        }
        
        if (bestSellingProductId && maxSoldUnits >= missionGoal) {
            console.log(`CRON: Loja ${loja.id}: Produto ${bestSellingProductId} vendeu ${maxSoldUnits} unidades. Meta de ${missionGoal} alcançada!`);
            await trackMissionProgress(loja.id, 'best_selling_product', maxSoldUnits, { ownerId: loja.id_empresa }); 
        } else {
            console.log(`CRON: Loja ${loja.id}: Nenhum produto atingiu a meta de ${missionGoal} vendas este mês. Produto mais vendido: ${bestSellingProductId || 'N/A'}, Unidades: ${maxSoldUnits}`);
            await trackMissionProgress(loja.id, 'best_selling_product', maxSoldUnits, { ownerId: loja.id_empresa });
        }
    }
    console.log('CRON: Finalizado verificação de Produto Mais Vendido (Mensal).');
}