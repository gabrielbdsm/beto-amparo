// Controller

import supabase from '../../config/SupaBase.js';
import jwt from 'jsonwebtoken';

class DonoController {
  async getDonoData(req, res) {
    try {
      // ... (Passos 1, 2 e 3 de verificação e busca da loja continuam iguais)
      const token = req.cookies?.token_empresa;
      if (!token) {
        return res.status(401).json({ error: 'Acesso não autorizado. Faça o login.' });
      }
      let loggedInEmpresaId;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        loggedInEmpresaId = decoded.id;
      } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
      }
      const { slug } = req.params;
      if (!slug) {
        return res.status(400).json({ error: 'Slug não fornecido' });
      }
      const { data: loja, error: lojaError } = await supabase
        .from('loja')
        .select('*, empresas(*)')
        .eq('slug_loja', slug)
        .single();
      if (lojaError || !loja) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }
      if (loja.id_empresa !== loggedInEmpresaId) {
        return res.status(403).json({ error: 'Acesso negado.' });
      }

      // --- PASSO 4: BUSCAR DADOS DO PAINEL EM PARALELO ---
      const { empresas: empresa, ...lojaData } = loja;

      const [
        produtosResult, 
        novosPedidosResult, 
        pedidosFinalizadosResult,
        produtosAtivosResult // <-- NOVA CONSULTA ADICIONADA
      ] = await Promise.all([
        // Busca a lista completa de produtos (pode ser útil para outras partes do front-end)
        supabase.from('produto').select('*').eq('id_loja', lojaData.id),
        
        // Conta os pedidos com status 1 (Novos Pedidos)
        supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('id_loja', lojaData.id).eq('status', 1),
        
        // Conta os pedidos com status 4 (Pedidos Finalizados)
        supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('id_loja', lojaData.id).eq('status', 4),

        // ▼▼▼ CONTA APENAS OS PRODUTOS COM status 'ativo' = true ▼▼▼
        supabase.from('produto').select('id', { count: 'exact', head: true }).eq('id_loja', lojaData.id).eq('ativo', true)
      ]);

      // Extrai os dados e os erros de cada consulta
      const { data: produtos, error: produtosError } = produtosResult;
      const { count: novosPedidosCount, error: novosPedidosError } = novosPedidosResult;
      const { count: pedidosFinalizadosCount, error: pedidosFinalizadosError } = pedidosFinalizadosResult;
      const { count: produtosAtivosCount, error: produtosAtivosError } = produtosAtivosResult; // <-- NOVO DADO

      // Verifica se houve erro em qualquer uma das consultas
      if (produtosError || novosPedidosError || pedidosFinalizadosError || produtosAtivosError) {
        console.error('Erro ao buscar dados do dashboard:', produtosError || novosPedidosError || pedidosFinalizadosError || produtosAtivosError);
        return res.status(500).json({ error: 'Erro ao buscar dados do dashboard.' });
      }

      // --- PASSO 5: RETORNAR TODOS OS DADOS JUNTOS ---
      return res.status(200).json({
        empresa,
        loja: lojaData,
        produtos: produtos ?? [],
        novosPedidos: novosPedidosCount ?? 0,
        pedidosFinalizados: pedidosFinalizadosCount ?? 0,
        produtosAtivos: produtosAtivosCount ?? 0, // <-- NOVO CAMPO NA RESPOSTA
      });

    } catch (error) {
      console.error('Erro inesperado em getDonoData:', error);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  }

  // (o resto do seu controller continua igual)
  async getEmpresaIdFromTokenEndpoint(req, res) {
    console.log('DEBUG: DonoController: Chamando getEmpresaIdFromTokenEndpoint!');
    const token = req.cookies?.token_empresa;
    console.log('DEBUG: DonoController: Token recebido para empresa-id:', token ? 'Sim' : 'Não');

    if (!token) {
      console.warn('DEBUG: DonoController: Token não fornecido para /dono/empresa-id.');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('DEBUG: DonoController: Token decodificado para empresa-id. ID:', decoded.id);
      return res.status(200).json({ empresaId: decoded.id }); // Retorna o ID da empresa
    } catch (err) {
      console.error('DEBUG: DonoController: Erro ao verificar token para /dono/empresa-id:', err.message);
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  }

  async getMinhasLojas(req, res) {
        try {
            // 1. Obter o ID da empresa a partir do token
            const token = req.cookies?.token_empresa;
            if (!token) {
                return res.status(401).json({ error: 'Acesso não autorizado.' });
            }

            let loggedInEmpresaId;
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                loggedInEmpresaId = decoded.id;
            } catch (err) {
                return res.status(401).json({ error: 'Token inválido ou expirado.' });
            }

            // 2. Buscar os dados da empresa E as lojas em paralelo para otimizar
            const [empresaResult, lojasResult] = await Promise.all([
                supabase.from('empresas').select('nome').eq('id', loggedInEmpresaId).single(),
                supabase.from('loja').select('*').eq('id_empresa', loggedInEmpresaId)
            ]);

            const { data: empresaData, error: empresaError } = empresaResult;
            const { data: lojas, error: lojasError } = lojasResult;

            if (empresaError || lojasError) {
                console.error('Erro ao buscar dados:', empresaError || lojasError);
                return res.status(500).json({ error: 'Erro ao buscar os dados no banco de dados.' });
            }
            
            // 3. Retornar um objeto com os dados da empresa e a lista de lojas
            return res.status(200).json({
                empresa: empresaData,
                lojas: lojas
            });

        } catch (error) {
            console.error('Erro inesperado em getMinhasLojas:', error);
            return res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
}



export default new DonoController();