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

    if (!id_cliente || !id_loja || !data || !total || status === undefined) {
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
  const { id } = req.params;

  try {
    // Buscar o pedido pelo ID
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();

    if (pedidoError || !pedido) {
      return res.status(404).json({ erro: 'Pedido não encontrado' });
    }

    // Buscar os itens relacionados a esse pedido
    const { data: itens, error: itensError } = await supabase
      .from('pedido_itens')
      .select(`
        *,
        produto:produto_id ( nome, imagem, descricao )
      `)
      .eq('pedido_id', id);

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
  const { metodoPagamento, enderecoEntrega, cupom, clienteId } = req.body;

  // Validação inicial dos dados obrigatórios
  if (!metodoPagamento || !enderecoEntrega || !clienteId) {
    return res.status(400).json({ erro: 'Dados incompletos para finalização' });
  }

  try {
    // 1. Validação da loja
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('id, tempo_preparo_padrao')
      .eq('slug_loja', slug)
      .single();

    if (lojaError || !loja) {
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    // 2. Buscar e validar pedido aberto
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select(`
        *,
        pedido_itens:pedido_itens(
          *,
          produto:produtos(
            id,
            nome,
            estoque,
            preco
          )
        )
      `)
      .eq('id_loja', loja.id)
      .eq('id_cliente', clienteId)
      .eq('status', 'aberto')
      .single();

    if (pedidoError || !pedido) {
      return res.status(404).json({
        erro: 'Nenhum pedido aberto encontrado ou pedido já finalizado',
        sugestao: '/carrinho'
      });
    }

    // 3. Validação de estoque e cálculo de totais
    let itensInvalidos = [];
    let subtotal = 0;

    for (const item of pedido.pedido_itens) {
      subtotal += item.quantidade * item.produto.preco;

      if (item.produto.estoque < item.quantidade) {
        itensInvalidos.push({
          produto: item.produto.nome,
          disponivel: item.produto.estoque,
          solicitado: item.quantidade
        });
      }
    }

    if (itensInvalidos.length > 0) {
      return res.status(400).json({
        erro: 'Estoque insuficiente',
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

    // 6. Transação para atualizar pedido e estoque
    const { data: pedidoFinalizado, error: transacaoError } = await supabase.rpc('finalizar_pedido', {
      pedido_id: pedido.id,
      novo_status: 'finalizado',
      metodo_pagamento: metodoPagamento,
      endereco_entrega: enderecoEntrega,
      desconto_aplicado: desconto,
      total_pago: totalFinal,
      tempo_preparo: loja.tempo_preparo_padrao
    });

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
    console.error('Erro ao finalizar pedido:', error);
    res.status(500).json({
      erro: error.message || 'Erro interno ao finalizar pedido',
      sugestao: '/contato'
    });
  }
}