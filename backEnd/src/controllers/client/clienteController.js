import Cliente from '../../models/ClienteModel.js';
import supabase from '../../config/SupaBase.js';
import bcrypt from 'bcrypt';


class ClienteController {


  async listar(req, res) {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*');

      if (error) throw error;

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      return res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
  }

  async obterPorId(req, res) {
    try {
      const id = req.params.id;
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      return res.status(200).json(data);
    } catch (error) {
      console.error('Erro ao obter cliente:', error);
      return res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  }

  async atualizar(req, res) {
    try {
      const id = req.params.id;
      const novosDados = req.body;

      if (novosDados.senha) {
        novosDados.senha = await bcrypt.hash(novosDados.senha, 10);
      }

      const { data, error } = await supabase
        .from('clientes')
        .update(novosDados)
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      return res.status(200).json({
        success: true,
        message: 'Cliente atualizado com sucesso',
        cliente: data[0]
      });
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      return res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  }

  async remover(req, res) {
    try {
      const id = req.params.id;

      const { data, error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      return res.status(200).json({
        success: true,
        message: 'Cliente removido com sucesso',
        cliente: data[0]
      });
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      return res.status(500).json({ error: 'Erro ao remover cliente' });
    }
  }

  async atualizarPontos(req, res) {
    try {
      const id = req.params.id;
      const { total_pontos } = req.body;

      if (typeof total_pontos !== 'number') {
        return res.status(400).json({ error: 'O campo total_pontos deve ser um número.' });
      }

      const { data, error } = await supabase
        .from('clientes')
        .update({ total_pontos })
        .eq('id', id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Cliente não encontrado.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Pontos atualizados com sucesso.',
        cliente: data[0]
      });

    } catch (error) {
      console.error('Erro ao atualizar pontos do cliente:', error);
      return res.status(500).json({ error: 'Erro ao atualizar pontos do cliente.' });
    }
  }

  async ganharPontos(req, res) {
    try {
      const id = req.params.id;
      const { valorTotalCompra, usouPontos } = req.body;

      if (typeof valorTotalCompra !== 'number' || valorTotalCompra <= 0) {
        return res.status(400).json({ error: 'O campo valorTotalCompra deve ser um número positivo.' });
      }

      if (typeof usouPontos !== 'boolean') {
        return res.status(400).json({ error: 'O campo usouPontos deve ser um booleano (true ou false).' });
      }

      // Busca o valorPonto configurado na tabela loja
    const { data: loja, error: erroLoja } = await supabase
      .from('loja')
      .select('valorPonto')
      .single();

    if (erroLoja) throw erroLoja;
    if (!loja || typeof loja.valorPonto !== 'number' || loja.valorPonto <= 0) {
      return res.status(500).json({ error: 'Configuração inválida do valorPonto na loja.' });
    }

    const valorPonto = loja.valorPonto;

      // Se o cliente usou pontos, ele NÃO ganha novos pontos
      if (usouPontos) {
        return res.status(200).json({ message: 'Cliente utilizou pontos nesta compra, não será creditado novos pontos.' });
      }

      const pontosGanhos = Math.floor(valorTotalCompra / valorPonto);

      // Busca os pontos atuais do cliente
      const { data: cliente, error: erroBusca } = await supabase
        .from('clientes')
        .select('total_pontos')
        .eq('id', id)
        .single();

      if (erroBusca) throw erroBusca;
      if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado.' });

      const novosPontos = cliente.total_pontos + pontosGanhos;

      const { data, error } = await supabase
        .from('clientes')
        .update({ total_pontos: novosPontos })
        .eq('id', id)
        .select();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: `Compra concluída. ${pontosGanhos} ponto(s) adicionados ao cliente.`,
        cliente: data[0]
      });

    } catch (error) {
      console.error('Erro ao calcular pontos:', error);
      return res.status(500).json({ error: 'Erro ao calcular pontos.' });
    }
  }

}

export default new ClienteController();
 