/*
const Cliente = require('../src/models/clienteModel');
const supabase = require('../src/config/supabase');
const bcrypt = require('bcrypt');
require('dotenv').config();
*/
import Personalizacao from '../models/Personalizacao.js';
import Cliente from '../src/models/clienteModel.js';
import supabase from '../src/config/supabase.js';
import bcrypt from 'bcrypt';

class ClienteController {
async cadastrar(req, res) {
  try {
    console.log('Dados recebidos:', req.body); // Log para depuração
    
    const clienteData = req.body;
    if (!clienteData) {
      return res.status(400).json({ error: 'Dados do cliente não fornecidos' });
    }

    const cliente = new Cliente(clienteData);
    const erros = cliente.validar();
    
    if (erros.length > 0) {
      return res.status(400).json({ erros });
    }

    // Verifica se cliente já existe
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
    console.error('Erro detalhado:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
}

export default new ClienteController();