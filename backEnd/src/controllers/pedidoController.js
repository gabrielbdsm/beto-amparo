import { buscarPedidosPorSlug } from '../models/PedidoModel.js';
import supabase from '../config/SupaBase.js';

export async function listarPedidosPorEmpresa(req, res) {
  const { slug } = req.params;

  try {
    // Buscar ID da loja pelo slug
    const { data: loja, error: lojaError } = await supabase
      .from('loja')
      .select('id')
      .eq('slug_loja', slug)
      .single();

    if (lojaError || !loja) {
      console.error('Erro ao buscar loja:', lojaError);
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    const lojaId = loja.id;

    // Agora buscar pedidos pelo id_loja
    const { data: pedidos, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id_loja', lojaId);

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
      return res.status(500).json({ erro: 'Erro ao buscar pedidos' });
    }

    res.json(pedidos);
  } catch (error) {
    console.error('Erro inesperado:', error);
    res.status(500).json({ erro: 'Erro ao buscar pedidos' });
  }
}

export async function criarPedido(req, res) {
  try {
    const { id_cliente, id_loja, data, total, status, observacoes } = req.body;

    console.log('Dados recebidos:', { id_cliente, id_loja, data, total, observacoes });

    // Validação explícita de cada campo obrigatório
    if (
      id_cliente == null || // null ou undefined
      id_loja == null ||
      !data ||              // string vazia também falha aqui
      total == null
    ) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
    }

    const { data: novoPedido, error } = await supabase
      .from('pedidos')
      .insert([
        {
          id_cliente,
          id_loja,
          data,
          total,
          status,
          observacoes
        }
      ])
      .select()  // para retornar o registro inserido
      .single();

    if (error) {
      console.error('Erro ao criar pedido:', error);
      return res.status(500).json({ erro: 'Erro interno ao criar pedido' });
    }

    res.status(201).json(novoPedido);

  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({ erro: 'Erro interno ao criar pedido' });
  }
}

export async function adicionarItemPedido(req, res) {
  try {
    const { pedido_id, produto_id, quantidade, preco_unitario } = req.body;

    if (!pedido_id || !produto_id || !quantidade || !preco_unitario) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
    }

    const { data: itemInserido, error } = await supabase
      .from('pedido_itens')
      .insert([
        {
          pedido_id,
          produto_id,
          quantidade,
          preco_unitario
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar item ao pedido:', error);
      return res.status(500).json({ erro: 'Erro interno ao adicionar item' });
    }

    res.status(201).json(itemInserido);

  } catch (error) {
    console.error('Erro ao adicionar item ao pedido:', error);
    res.status(500).json({ erro: 'Erro interno ao adicionar item' });
  }
}

export async function obterPedidoPorId(req, res) {
  const { pedidoId } = req.params;

  try {
    // Buscar o pedido pelo ID
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single();

    if (pedidoError || !pedido) {
      return res.status(404).json({ erro: 'Pedido não encontrado' });
    }

    // Buscar os itens relacionados a esse pedido
    const { data: itens, error: itensError } = await supabase
      .from('pedido_itens')
      .select(`
        *,
        produto:produto_id ( nome, image, descricao, preco )
      `)
      .eq('pedido_id', pedidoId);

    if (itensError) {
      return res.status(500).json({ erro: 'Erro ao buscar itens do pedido' });
    }

    res.json({
      ...pedido,
      itens: itens || []
    });
  } catch (error) {
    console.error('Erro ao obter pedido por ID:', error);
    res.status(500).json({ erro: 'Erro interno ao obter pedido' });
  }
}

export async function finalizarPedido(req, res) {
  const { slug } = req.params;
  const { metodoPagamento, enderecoEntrega, cupom, clienteId, itens } = req.body;
  console.log("BODY recebido em finalizarPedido:", req.body);
  console.log("slug:", slug);

  // Validação reforçada
  if (!slug || !metodoPagamento || !enderecoEntrega || !clienteId || !Array.isArray(itens)) {
    return res.status(400).json({
      erro: 'Dados incompletos',
      campos_necessarios: {
        slug: !slug,
        metodoPagamento: !metodoPagamento,
        enderecoEntrega: !enderecoEntrega,
        clienteId: !clienteId,
        itens: !itens
      }
    });
  }

  try {
    // 1. Validação da loja
    const { data: loja, error: lojaError } = await supabase
      .from('loja')
      .select('id')
      .eq('slug_loja', slug)
      .single();

    if (lojaError) {
      console.error('Erro Supabase:', lojaError);
      return res.status(500).json({ erro: 'Erro ao buscar loja' });
    }
    if (!loja) {
      return res.status(404).json({
        erro: 'Loja não encontrada',
        slug_procurado: slug,
        sugestao: 'Verifique o slug da loja'
      });
    }

    const pedidoId = itens?.[0]?.pedido_id;

    if (!pedidoId) {
      return res.status(400).json({
        erro: 'pedido_id não encontrado nos itens',
        detalhes: 'Certifique-se de que os itens possuem pedido_id válido'
      });
    }

    // 2. Buscar e validar pedido aberto
    const { data: pedido, error: pedidoError } = await supabase
  .from('pedidos')
  .select('*')
  .eq('id', pedidoId)
  .eq('id_cliente', clienteId)
  .eq('id_loja', loja.id)
  .eq('status', 0)
  .single();

    // Buscar os itens do pedido
const { data: pedido_itens, error: itensError } = await supabase
  .from('pedido_itens')
  .select(`*, produto:produto_id ( nome, preco, quantidade )`)  // traz info do produto relacionado
  .eq('pedido_id', pedidoId);

if (itensError) {
  return res.status(500).json({ erro: 'Erro ao buscar itens do pedido' });
}

// Agora, insira os itens dentro do objeto pedido para usar depois
pedido.pedido_itens = pedido_itens || [];

  if (pedidoError) {
  console.error("Erro ao buscar pedido:", pedidoError);
  return res.status(500).json({
    erro: 'Erro ao buscar pedido',
    detalhes: pedidoError.message || pedidoError
  });
  }

  if (!pedido) {
    return res.status(404).json({
      erro: 'Nenhum pedido encontrado',
      detalhes: {
        pedidoId,
        clienteId,
        lojaId: loja.id,
        statusEsperado: 0
      }
    });
  }


    // 3. Validação de quantidade e cálculo de totais
    let itensInvalidos = [];
    let subtotal = 0;

    for (const item of pedido.pedido_itens) {
      subtotal += item.quantidade * item.produto.preco;

      if (item.produto.quantidade < item.quantidade) {
        itensInvalidos.push({
          produto: item.produto.nome,
          disponivel: item.produto.quantidade,
          solicitado: item.quantidade
        });
      }
    }

    if (itensInvalidos.length > 0) {
      return res.status(400).json({
        erro: 'quantidade insuficiente',
        itens: itensInvalidos,
        sugestao: '/carrinho'
      });
    }

    // 4. Aplicação de cupom
    let desconto = 0;
    if (cupom) {
      const { data: cupomValido, error: cupomError } = await supabase
        .from('cupons')
        .select('valor_desconto, tipo, valido_ate')
        .eq('codigo', cupom)
        .eq('id_loja', loja.id)
        .eq('ativo', true)
        .single();

      if (!cupomError && cupomValido) {
        // Verifica se o cupom está dentro da validade
        const hoje = new Date();
        const validoAte = new Date(cupomValido.valido_ate);

        if (hoje <= validoAte) {
          desconto = cupomValido.tipo === 'porcentagem'
            ? subtotal * (cupomValido.valor_desconto / 100)
            : cupomValido.valor_desconto;
        }
      }
    }

    // 5. Cálculo do total final
    const totalFinal = subtotal - desconto + (pedido.taxa_entrega || 0);

    // 6. Transação para atualizar pedido e quantidade
    const { data, error: transacaoError } = await supabase.rpc('finalizar_pedido', {
      
      desconto_aplicado: desconto,
      endereco_entrega: enderecoEntrega,
      metodo_pagamento: metodoPagamento,
      novo_status: 'finalizado',
      pedido_id: pedido.id,
      total_pago: totalFinal,
    });

    if (transacaoError) {
      throw new Error(`Falha na transação: ${transacaoError.message}`);
    }

    const pedidoFinalizado = Array.isArray(data) ? data[0] : data;


    if (transacaoError) {
      throw new Error(`Falha na transação: ${transacaoError.message}`);
    }

    // 7. Retornar resposta com dados completos
    res.status(200).json({
      sucesso: true,
      pedido: {
        ...pedidoFinalizado,
        itens: pedido.pedido_itens // <-- Aqui está a adição necessária
      },
      resumo: {
        subtotal,
        desconto,
        taxa_entrega: pedido.taxa_entrega || 0,
        total: totalFinal
      },
      mensagem: 'Pedido finalizado com sucesso',
      proximos_passos: '/acompanhar-pedido'
    });

  } catch (error) {
    console.error('Erro detalhado:', error);
    res.status(500).json({
      erro: 'Erro interno',
      detalhes: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}