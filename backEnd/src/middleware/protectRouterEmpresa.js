import * as empresas from "../models/EmpresaModel.js";
import JWT from "jsonwebtoken";

export const empresaPrivate = async (req, res, next) => {
    const token = req.cookies?.token_empresa;
  
    if (!token) {
      return res.status(401).json({ error: "Acesso não autorizado para empresa." });
    }
  
    try {
      const decoded = JWT.verify(token, process.env.JWT_SECRET);
  
      if (decoded.tipo !== "empresa") {
        return res.status(403).json({ error: "Acesso negado. Não é uma empresa." });
      }
  
      const empresa = await empresas.buscarEmpresaPorId(decoded.id);
  
      if (!empresa) {
        return res.status(401).json({ error: "Empresa não encontrada." });
      }
      
      req.IdEmpresa = decoded.id;
      req.user = empresa;
      req.userTipo = decoded.tipo;

      next();
    } catch (err) {
      return res.status(401).json({ error: "Token inválido ou expirado." });
    }
  };

  export const verificarAutenticacaoEmpresa = async (req, res, next) => { // <-- Renomeado para o nome que você está usando
    const token = req.cookies?.token_empresa;

    if (!token) {
        return res.status(401).json({ mensagem: "Não autorizado. Token de autenticação não fornecido.", redirectTo: '/empresa/LoginEmpresa' }); // Retorna mensagem mais amigável e redirectTo
    }

    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET);

        // Verifica se o token tem o tipo correto (empresa)
        if (decoded.tipo !== "empresa") {
            return res.status(403).json({ mensagem: "Acesso negado. Credenciais inválidas para empresa.", redirectTo: '/empresa/LoginEmpresa' });
        }

        // Busca a empresa para garantir que ela ainda existe e está ativa
        const empresa = await empresas.buscarEmpresaPorId(decoded.id);

        if (!empresa) {
            return res.status(401).json({ mensagem: "Empresa associada ao token não encontrada.", redirectTo: '/empresa/LoginEmpresa' });
        }
        
        // Atribui o ID da empresa logada à requisição (req.idEmpresa)
        req.idEmpresa = decoded.id; 
        
        // Você pode manter req.user e req.userTipo se forem usados em outros lugares
        // req.user = empresa; 
        // req.userTipo = decoded.tipo;

        next(); // Passa para o próximo middleware ou rota
    } catch (err) {
        console.error('Middleware Auth Empresa: Erro ao verificar token:', err);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ mensagem: "Sessão expirada. Faça login novamente.", redirectTo: '/empresa/LoginEmpresa' });
        }
        return res.status(401).json({ mensagem: "Não autorizado. Token inválido ou erro inesperado.", redirectTo: '/empresa/LoginEmpresa' });
    }
};
  