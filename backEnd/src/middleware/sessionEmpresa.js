import * as empresas from "../models/EmpresaModel.js";
import JWT from "jsonwebtoken";


 export  const  routePrivate = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Acesso não autorizado. Token ausente." });
  }

  try {
    const decoded = JWT.verify(token, process.env.SECRETKEY);
    const user = await  empresas.buscarEmpresaPorId(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "Usuário não encontrado." });
    }

    
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
};
