// src/controllers/ClienteController.js
const Cliente = require('../model/ClienteModel');
const supabase = require('@/config/supabase');

class ClienteController {
  async cadastrar(req, res) {
    try {
      const clienteData = req.body;
      const cliente = new Cliente(clienteData);
      
      const erros = cliente.validar();
      if (erros.length > 0) {
        return res.status(400).json({ erros });
      }
      
      // Inserir no Supabase
      const { data, error } = await supabase
        .from('clientes')
        .insert([
          {
            nome: cliente.nome,
            email: cliente.email,
            telefone: cliente.telefone,
            endereco: cliente.endereco,
            cidade: cliente.cidade,
            uf: cliente.uf,
            cpf: cliente.cpf,
            senha: cliente.senha,
            data_nascimento: cliente.data_nascimento
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      return res.status(201).json({ 
        mensagem: 'Cliente cadastrado com sucesso',
        cliente: data[0]
      });
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      
      // Tratar erros específicos do Supabase
      if (error.code === '23505') {
        return res.status(400).json({ 
          erro: 'Cliente já cadastrado (e-mail ou CPF já existente)'
        });
      }
      
      return res.status(500).json({ 
        erro: error.message || 'Erro interno do servidor' 
      });
    }
  }
}

module.exports = new ClienteController();