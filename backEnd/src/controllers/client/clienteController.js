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
}

export default new ClienteController();
 