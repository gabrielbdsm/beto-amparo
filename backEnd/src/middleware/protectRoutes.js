import * as empresas from "../models/EmpresaModel.js";
import * as clientes from "../models/ClienteModel.js"; // supondo que tenha isso
import JWT from "jsonwebtoken";

export const routePrivate = async (req, res, next) => {
  const token = req.cookies?.token_cliente || req.cookies?.token_empresa;
  
  if (!token) {
    return res.status(401).json({ error: "Acesso não autorizado. Token ausente." });
  }

  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);

    let user;

    if (decoded.tipo === "empresa") {
      user = await empresas.buscarEmpresaPorId(decoded.id);
    } else if (decoded.tipo === "cliente") {
      user = await clientes.buscarClientePorId(decoded.id);
    } else {
      return res.status(403).json({ error: "Tipo de usuário inválido." });
    }

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado." });
    }

    req.Id = decoded.id;
    req.user = user;
    req.userTipo = decoded.tipo;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
};
