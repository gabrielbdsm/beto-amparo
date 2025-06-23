import { buscarPedidosPorSlug } from '../models/PedidoModel.js';
import * as PedidoModel from '../models/PedidoModel.js';
import supabase from '../config/SupaBase.js';
import jwt from 'jsonwebtoken'; // Para decodificar o token
import * as lojaModel from '../models/Loja.js';
import { trackMissionProgress } from '../../services/missionTrackerService.js';
import { decrementarEstoque } from '../controllers/produto/ProdutoController.js';
console.log('DEBUG: pedidoController.js carregado.');

async function getEmpresaIdFromToken(req) {
  const token = req.cookies?.token_empresa;
  if (!token) return { error: { message: 'Token não fornecido no cookie' } };
  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return { empresaId: decoded.id };
  } catch (err) {
      return { error: { message: 'Token inválido ou expirado' } };
  }
}

export const listarPedidosPorCliente = async (req, res) => {
    const { slug, clienteId } = req.params;

    try {
        const { data: loja, error: lojaError } = await supabase
            .from('loja')
            .select('id')
            .eq('slug_loja', slug) // Use o slug recebido
            .single();

        if (lojaError || !loja) {
            return res.status(404).json({ erro: 'Loja não encontrada' });
        }

        const { data: pedidos, error } = await supabase
            .from('pedidos')
            .select('*')
            .eq('id_loja', loja.id)
            .eq('id_cliente', clienteId);

        if (error) {
            console.error("Erro ao buscar pedidos do cliente:", error);
            return res.status(500).json({ erro: 'Erro ao buscar pedidos' });
        }

        res.status(200).json(pedidos);
    } catch (error) {
        console.error("Erro interno no servidor:", error);
        res.status(500).json({ erro: 'Erro interno no servidor' });
    }
};


export const getItensDoPedido = async (req, res) => {
  const { idPedido } = req.params;

  // Busca os itens do pedido
  const { data: itens, error: itensError } = await supabase
    .from('pedido_itens')
    .select('*')
    .eq('pedido_id', idPedido);

  if (itensError) {
    console.error(itensError);
    return res.status(500).json({ erro: 'Erro ao buscar itens do pedido.' });
  }

  // Para cada item, busca o nome do produto correspondente
  const itensComNome = await Promise.all(itens.map(async (item) => {
    const { data: produto, error: produtoError } = await supabase
      .from('produto')
      .select('nome')
      .eq('id', item.produto_id)
      .single();

    return {
      ...item,
      nome_produto: produto ? produto.nome : 'Produto não encontrado'
    };
  }));

  res.json(itensComNome);
};

// --- FUNÇÃO: getHistoricoPedidos ---
export const getHistoricoPedidos = async (req, res) => {
      console.log('DEBUG: PedidoController.js: Chamando getHistoricoPedidos!'); // Este log permanece
      try {
          // Nova primeira linha dentro do try para depuração
          console.log('DEBUG: getHistoricoPedidos - Iniciando bloco TRY.'); 
  
          const { slugLoja } = req.params;
          console.log('DEBUG: getHistoricoPedidos - Slug da loja recebido:', slugLoja);
    
          const { empresaId: empresaIdDoToken, error: tokenError } = await getEmpresaIdFromToken(req);
          if (tokenError) {
              console.warn('DEBUG: getHistoricoPedidos - Token de empresa inválido:', tokenError.message);
              return res.status(401).json({ error: tokenError.message });
          }
          console.log('DEBUG: getHistoricoPedidos - Empresa ID do token:', empresaIdDoToken);
    
          const { data: lojaDetalhes, error: lojaError } = await lojaModel.buscarLojaPorSlugCompleta(slugLoja);
          if (lojaError || !lojaDetalhes) {
              console.error('DEBUG: getHistoricoPedidos - Erro ao buscar loja por slug:', lojaError?.message || 'Loja não encontrada para o slug:', slugLoja);
              return res.status(404).json({ mensagem: 'Loja não encontrada com o identificador fornecido.' });
          }
          console.log('DEBUG: getHistoricoPedidos - Loja encontrada para slug:', slugLoja, 'ID:', lojaDetalhes.id, 'Empresa ID:', lojaDetalhes.id_empresa);
    
          if (lojaDetalhes.id_empresa !== empresaIdDoToken) {
              console.warn('DEBUG: getHistoricoPedidos - Acesso negado. Loja', slugLoja, 'não pertence à empresa', empresaIdDoToken);
              return res.status(403).json({ mensagem: 'Acesso negado: Você não tem permissão para acessar pedidos desta loja.' });
          }
          
          const lojaIdParaPedidos = lojaDetalhes.id;
          console.log('DEBUG: getHistoricoPedidos - Buscando histórico para loja ID:', lojaIdParaPedidos);
    
          const { data: pedidos, error: pedidosError } = await PedidoModel.listarPedidosDaLoja(lojaIdParaPedidos);
    
          if (pedidosError) {
              console.error('DEBUG: getHistoricoPedidos - Erro ao buscar histórico de pedidos no modelo:', pedidosError.message);
              return res.status(500).json({ mensagem: 'Erro ao carregar histórico de pedidos.' });
          }
          console.log('DEBUG: getHistoricoPedidos - Histórico de pedidos carregado com sucesso:', pedidos.length, 'pedidos.');
          return res.status(200).json(pedidos);
      } catch (error) {
              // Este console.error foi atualizado para ser mais detalhado
          console.error('DEBUG: getHistoricoPedidos - ERRO CAPTURADO NO CATCH:', error.name, error.message, error.stack);
          if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
              return res.status(401).json({ error: 'Token inválido ou expirado.' });
          }
          return res.status(500).json({ mensagem: 'Erro interno do servidor.', detalhes: error.message });
      }
  };

// --- FUNÇÃO: getDadosGraficoVendas ---
export const getDadosGraficoVendas = async (req, res) => {
  console.log('DEBUG: PedidoController.js: Chamando getDadosGraficoVendas!');
  try {
      const { slugLoja } = req.params; // NOVO: Pega o slug da loja da URL
      console.log('DEBUG: getDadosGraficoVendas - Slug da loja recebido:', slugLoja);

      const { empresaId: empresaIdDoToken, error: tokenError } = await getEmpresaIdFromToken(req);
      if (tokenError) {
          console.warn('DEBUG: getDadosGraficoVendas - Token de empresa inválido:', tokenError.message);
          return res.status(401).json({ error: tokenError.message });
      }
      console.log('DEBUG: getDadosGraficoVendas - Empresa ID do token:', empresaIdDoToken);

      // 1. Buscar a loja pelo slug para obter o ID e o ID da empresa associada
      const { data: lojaDetalhes, error: lojaError } = await lojaModel.buscarLojaPorSlugCompleta(slugLoja);
      if (lojaError || !lojaDetalhes) {
          console.error('DEBUG: getDadosGraficoVendas - Erro ao buscar loja por slug:', lojaError?.message || 'Loja não encontrada para o slug:', slugLoja);
          return res.status(404).json({ mensagem: 'Loja não encontrada com o identificador fornecido.' });
      }
      console.log('DEBUG: getDadosGraficoVendas - Loja encontrada para slug:', slugLoja, 'ID:', lojaDetalhes.id, 'Empresa ID:', lojaDetalhes.id_empresa);

      // 2. Verificar se a loja pertence à empresa do token (Autorização)
      if (lojaDetalhes.id_empresa !== empresaIdDoToken) {
          console.warn('DEBUG: getDadosGraficoVendas - Acesso negado. Loja', slugLoja, 'não pertence à empresa', empresaIdDoToken);
          return res.status(403).json({ mensagem: 'Acesso negado: Você não tem permissão para acessar dados desta loja.' });
      }

      const { periodo } = req.query;
      const lojaIdParaGrafico = lojaDetalhes.id; // ID da loja para buscar dados do gráfico
      console.log('DEBUG: getDadosGraficoVendas - Buscando dados do gráfico para loja ID:', lojaIdParaGrafico, 'Período:', periodo);

      const { data: dadosGrafico, error: graficoError } = await PedidoModel.getDadosVendasAgregados(lojaIdParaGrafico, periodo);

      if (graficoError) {
          console.error('DEBUG: getDadosGraficoVendas - Erro ao buscar dados para gráfico de vendas no modelo:', graficoError.message);
          return res.status(500).json({ mensagem: 'Erro ao carregar dados do gráfico.' });
      }
      console.log('DEBUG: getDadosGraficoVendas - Dados do gráfico carregados com sucesso.');
      return res.status(200).json(dadosGrafico);
  } catch (error) {
      console.error('DEBUG: getDadosGraficoVendas - Erro inesperado no controlador:', error);
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token inválido ou expirado.' });
      }
      return res.status(500).json({ mensagem: 'Erro interno do servidor.' });
  }
}

export async function listarPedidosPorEmpresa(req, res) {
  const { slug } = req.params;
  const { cliente_id } = req.query; 

  try {
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

    let query = supabase
      .from('pedidos')
      .select('*')
      .eq('id_loja', lojaId);

    if (cliente_id) {
      query = query.eq('id_cliente', cliente_id); 
    }

    const { data: pedidos, error } = await query;

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

export const getPedidoPorId = async (req, res) => {
  const { slug, pedidoId } = req.params;

  try {
    // 1. Buscar loja pelo slug
    const { data: loja, error: lojaError } = await supabase
      .from('loja')
      .select('id')
      .eq('slug_loja', slug)
      .single();

    if (lojaError || !loja) {
      return res.status(404).json({ erro: 'Loja não encontrada' });
    }

    // 2. Buscar o pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .eq('id_loja', loja.id)
      .single();

    if (pedidoError || !pedido) {
      return res.status(404).json({ erro: 'Pedido não encontrado' });
    }

    // 3. Buscar os itens do pedido com os dados do produto
    const { data: itens, error: itensError } = await supabase
      .from('pedido_itens')
      .select(`
        *,
        produto:produto_id ( nome, preco, image, descricao )
      `)
      .eq('pedido_id', pedidoId);

    if (itensError) {
      return res.status(500).json({ erro: 'Erro ao buscar itens do pedido' });
    }

    // 4. Retornar dados completos
    res.json({
      ...pedido,
      itens: itens || []
    });

  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({ erro: 'Erro interno ao buscar pedido' });
  }
};


export async function criarPedido(req, res) {
  try {
    const { id_cliente, id_loja, data, total, status, observacoes, desconto } = req.body;

    console.log('Dados recebidos:', { id_cliente, id_loja, data, total, observacoes, desconto });

    if (!id_cliente || !id_loja || !data || !total || status === undefined) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
    }

    const { data: loja, error: lojaError } = await lojaModel.buscarLojaPorId(id_loja);

    if (lojaError) {
      console.error('Erro ao buscar status da loja:', lojaError);
      return res.status(500).json({ erro: 'Erro interno ao verificar status da loja.' });
    }
    if (!loja) {
      return res.status(404).json({ erro: 'Loja não encontrada para o ID fornecido.' });
    }

    if (loja.is_closed_for_orders) {
      return res.status(403).json({ erro: 'Esta loja está fechada para pedidos no momento.' });
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
          observacoes,
          desconto
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar pedido:', error);
      return res.status(500).json({ erro: 'Erro interno ao criar pedido' });
    }

    const ownerId = loja.id_empresa;
    // Chamada para missões de venda (Primeira Venda, Vendedor Prata, Mestre de Vendas Diário)
    if (ownerId) {
        await trackMissionProgress(ownerId, 'sale', 1); // Rastreia uma venda
        console.log('DEBUG_MISSAO: Missão "sale" (Primeira Venda, Vendedor Prata) rastreada para LOJA:', id_loja);
        await trackMissionProgress(id_loja, 'daily_sales', 1); // Rastreia para Mestre de Vendas Diário
        console.log('DEBUG_MISSAO: Missão "daily_sales" (Mestre de Vendas Diário) rastreada para LOJA:', id_loja);
    } else {
        console.warn('criarPedido: Não foi possível rastrear missão de venda: ID da empresa (dono) não encontrado para a loja.');
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
            console.log('--- DEBUG: FINALIZAR PEDIDO INICIADO NO CONTROLLER ---');
            console.log('DEBUG: finalizarPedido - req.params:', req.params);
            console.log('DEBUG: finalizarPedido - req.body:', req.body);

            const { slug } = req.params;
            const { metodoPagamento, enderecoEntrega, clienteId, itens } = req.body;
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
                  itens: !itens,
                }
              });
            }

            const pedidoId = itens?.[0]?.pedido_id;

            if (!pedidoId) {
              return res.status(400).json({
                erro: 'ID do pedido não fornecido',
                sugestao: 'Verifique se os itens possuem pedido_id válido'
              });
            }

            try {
              // 1. Validação da loja
              const { data: loja, error: lojaError } = await supabase
                .from('loja')
                .select('id, id_empresa') // id_empresa ainda é útil para outras missões se houver
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

              // 2. Buscar e validar pedido aberto
              const { data: pedido, error: pedidoError } = await supabase
                .from('pedidos')
                .select('*')
                .eq('id', pedidoId)
                .eq('id_cliente', clienteId)
                .eq('id_loja', loja.id)
                .eq('status', 0)
                .single();

              if (pedidoError || !pedido) {
                console.error("Erro ao buscar pedido:", pedidoError);
                return res.status(404).json({
                  erro: 'Nenhum pedido aberto encontrado',
                  detalhes: {
                    pedidoId,
                    clienteId,
                    lojaId: loja.id
                  }
                });
              }

              if (pedido.status === 4) {
                return res.status(400).json({
                  erro: 'Pedido já finalizado',
                  detalhes: {
                    data_finalizacao: pedido.data_finalizacao,
                    status_atual: pedido.status
                  },
                  sugestao: 'Verifique seu histórico de pedidos'
                });
              }

              // Buscar os itens do pedido com os dados do produto necessários para o estoque
              const { data: pedido_itens, error: itensError } = await supabase
                .from('pedido_itens')
                .select(`
                  *,
                  produto:produto_id ( id, nome, preco, quantidade, controlar_estoque )
                `)
                .eq('pedido_id', pedidoId);

              if (itensError) {
                return res.status(500).json({ erro: 'Erro ao buscar itens do pedido' });
              }

              pedido.pedido_itens = pedido_itens || [];

              let itensInvalidos = [];
              let subtotal = 0;

              for (const item of pedido.pedido_itens) {
                subtotal += item.quantidade * item.produto.preco;

                if (item.produto.controlar_estoque && item.produto.quantidade < item.quantidade) {
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

              // --- NOVO: Decrementar estoque para cada item E RASTREAR PRODUTO ZERADO ---
              const decrementoPromises = pedido.pedido_itens.map(async (item) => {
                  if (item.produto.controlar_estoque) {
                    const { success, newQuantity, error } = await decrementarEstoque(item.produto.id, item.quantidade); // Usar ProdutoModel.decrementarEstoque
                      if (!success) {
                          console.error(`Falha ao decrementar estoque para produto ${item.produto.id}:`, error);
                          throw new Error(`Falha crítica ao atualizar estoque do produto ${item.produto.nome}: ${error}`);
                      }
                      // Rastrear Missão "Produto com Estoque Zerado"
                      if (newQuantity === 0) {
                          console.log(`DEBUG_MISSAO: Produto ID ${item.produto.id} da loja ${loja.id} zerou o estoque. Chamando trackMissionProgress para 'product_sold_out'.`);
                          await trackMissionProgress(loja.id, 'product_sold_out', 1);
                      }
                  }
              });

              await Promise.all(decrementoPromises); // Aguarda todos os decrementos concluírem
              // --- FIM NOVO DECREMENTO E RASTREAMENTO PRODUTO ZERADO ---

              const desconto = 0; // Se o desconto vier do body, use-o aqui
              const totalFinal = subtotal - desconto;

              const { data: pedidoAtualizado, error: updateError } = await supabase
                .from('pedidos')
                .update({
                  status: 4, // Status de finalizado
                  metodo_pagamento: metodoPagamento,
                  endereco_entrega: enderecoEntrega,
                  desconto: desconto,
                  total: totalFinal,
                  data_finalizacao: new Date()
                })
                .eq('id', pedido.id)
                .eq('id_cliente', clienteId)
                .select()
                .single();

              if (updateError) {
                console.error('Erro ao atualizar pedido:', updateError);
                return res.status(500).json({ erro: 'Erro ao atualizar pedido' });
              }

              // Rastreamento de missão de venda (Primeira Venda, Vendedor Prata, Mestre de Vendas Diário)
              const lojaIdParaMissao = loja.id;
              if (lojaIdParaMissao) {
                  // 'sale' cobre as missões 'Primeira Venda' e 'Vendedor Prata' (seus types são 'sale')
                  await trackMissionProgress(lojaIdParaMissao, 'sale', 1); 
                  console.log('DEBUG_MISSAO: Missão "sale" (Primeira Venda, Vendedor Prata) rastreada para LOJA:', lojaIdParaMissao);

                  // 'daily_sales' cobre a missão 'Mestre de Vendas Diário' (se o type for 'daily_sales' no DB)
                  // OU, se 'Mestre de Vendas Diário' tiver type 'sale' e for apenas repetível diário, a chamada 'sale' acima já cobriria.
                  // Para clareza, se Mestre de Vendas Diário tem type 'daily_sales', então o seguinte seria necessário:
                  // Se sua missão 'Mestre de Vendas Diário' tem type: 'daily_sales', use a linha abaixo:
                  // await trackMissionProgress(lojaIdParaMissao, 'daily_sales', 1);
                  // console.log('DEBUG_MISSAO: Missão "daily_sales" (Mestre de Vendas Diário) rastreada para LOJA:', lojaIdParaMissao);
                  // Se 'Mestre de Vendas Diário' tem type: 'sale', a linha acima já o rastreia.
                  // Pela sua imagem anterior, 'Mestre de Vendas Diário' tem type: 'sale'. Então, uma única chamada para 'sale' basta.
                  // Não precisa de uma segunda chamada aqui para 'daily_sales' se o tipo da missão for 'sale'.
                  // O missionTrackerService.js se encarregará de verificar se a missão com type 'sale' é repetível diária.
              } else {
                  console.warn('finalizarPedido: Não foi possível rastrear missões de venda: ID da loja não encontrado.');
              }

              res.status(200).json({
                sucesso: true,
                pedido: {
                  ...pedidoAtualizado,
                  itens: pedido.pedido_itens
                },
                resumo: {
                  subtotal,
                  desconto,
                  total: totalFinal
                },
                mensagem: 'Pedido finalizado com sucesso'
              });

            } catch (error) {
              console.error('Erro detalhado em finalizarPedido (catch geral):', error);
              res.status(500).json({
                erro: 'Erro interno',
                detalhes: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
              });
            }
          }