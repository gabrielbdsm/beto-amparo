// src/controllers/loginController.js
import Login from '../models/loginModel.js';
import supabase from '../config/SupaBase.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

class LoginController {
  async autenticar(req, res) {
    try {
      console.log('Dados recebidos no login:', req.body);
      const loginData = req.body;

      if (!loginData) {
        return res.status(400).json({ error: 'Dados de login não fornecidos' });
      }

      const login = new Login(loginData);
      const erros = login.validar();

      if (erros.length > 0) {
        return res.status(400).json({ erros });
      }

      // Busca o cliente pelo email
      const { data: cliente, error: erroBusca } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', login.email.toLowerCase().trim())
        .single();

      if (erroBusca) throw erroBusca;
      if (!cliente) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verifica a senha
      const senhaValida = await bcrypt.compare(login.senha, cliente.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Gera token JWT (adicione sua chave secreta no .env)
      const token = jwt.sign(
        { id: cliente.id, email: cliente.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Retorna o token e informações básicas do cliente (sem a senha)
      const { senha, ...clienteSemSenha } = cliente;
      
      return res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        token,
        cliente: clienteSemSenha
      });

    } catch (error) {
      console.error('Erro no processo de login:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

export default new LoginController();