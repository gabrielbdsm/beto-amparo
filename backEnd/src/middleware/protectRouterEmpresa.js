import * as empresas from "../models/EmpresaModel.js";
import JWT from "jsonwebtoken";

export const empresaPrivate = async (req, res, next) => {
  console.log('Cookies recebidos:', req.cookies);
  const token = req.cookies?.token_empresa;

  if (!token) {
    console.log('Token não encontrado nos cookies');
    return res.status(401).json({ error: "Acesso não autorizado para empresa." });
  }

  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);

    if (decoded.tipo !== "empresa") {
      return res.status(403).json({ error: "Acesso negado. Não é uma empresa." });
    }

    /*const empresa = await empresas.buscarEmpresaPorId(decoded.id);

    if (!empresa) {
      return res.status(401).json({ error: "Empresa não encontrada." });
    }*/
    const { data: empresa, error } = await empresas.buscarEmpresaPorId(decoded.id);

    if (error || !empresa) {
      return res.status(401).json({ error: "Empresa não encontrada." });
    }

    console.log('Empresa encontrada no banco:', empresa);

    const slugParam = (req.params.empresaSlug || '').toLowerCase().trim();
    const siteEmpresa = (empresa.site || '').toLowerCase().trim();
    const nomeEmpresa = (empresa.nome || '').toLowerCase().trim();

    console.log('Slug recebido:', slugParam);
    console.log('Slugs aceitáveis:', [siteEmpresa, nomeEmpresa]);

    console.log('Comparando slugs:');
    console.log('Slug da URL:', slugParam);
    console.log('Site da empresa:', siteEmpresa);
    console.log('Nome da empresa:', nomeEmpresa);

    /*if (slugParam && slugParam !== siteEmpresa && slugParam !== nomeEmpresa) {
      console.log('Acesso negado: Slug da URL não corresponde à empresa autenticada');
      return res.status(403).json({ error: "Você não tem permissão para acessar essas lojas." });
    }*/
    if (slugParam && ![siteEmpresa, nomeEmpresa].includes(slugParam)) {
      console.log('Acesso negado: Slug não corresponde');
      return res.status(403).json({
        error: "Acesso negado.",
        expectedSlugs: [siteEmpresa, nomeEmpresa],
        receivedSlug: slugParam
      });
    }

    req.IdEmpresa = decoded.id;
    req.user = empresa;
    req.userTipo = decoded.tipo;

    if (req.originalUrl.includes('/validate')) {
      return res.status(200).json({
        empresa_slug: empresa.site,
        empresa_id: empresa.id,
        acesso_permitido: true
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
};
