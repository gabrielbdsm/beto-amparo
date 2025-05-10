import Cliente from '../models/ClienteModel.js';
import supabase from '../config/SupaBase.js';
import bcrypt from 'bcrypt';

class ClienteController {
  async cadastrar(req, res) {
    try {
      console.log('Dados recebidos:', req.body);
      const clienteData = req.body;

      if (!clienteData) {
        return res.status(400).json({ error: 'Dados do cliente não fornecidos' });
      }

      const cliente = new Cliente(clienteData);
      const erros = cliente.validar();

      if (erros.length > 0) {
        return res.status(400).json({ erros });
      }

      const { data: existente, error: erroBusca } = await supabase
        .from('clientes')
        .select('*')
        .or(`email.eq.${cliente.email},cpf.eq.${cliente.cpf}`);

      if (erroBusca) throw erroBusca;
      if (existente.length > 0) {
        return res.status(400).json({ error: 'E-mail ou CPF já cadastrado' });
      }

      const senhaHash = await bcrypt.hash(cliente.senha, 10);

      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nome: cliente.nome,
          email: cliente.email.toLowerCase().trim(),
          telefone: cliente.telefone,
          endereco: cliente.endereco,
          cidade: cliente.cidade,
          uf: cliente.uf,
          cpf: cliente.cpf.replace(/\D/g, ''),
          senha: senhaHash,
          data_nascimento: cliente.data_nascimento || null
        }])
        .select();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'Cliente cadastrado com sucesso',
        cliente: data[0]
      });

    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

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
 