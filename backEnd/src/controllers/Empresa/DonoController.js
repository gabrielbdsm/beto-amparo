import supabase from '../../config/SupaBase.js';
import jwt from 'jsonwebtoken';

class DonoController {
  async getDonoData(req, res) {
    try {
      const token = req.cookies?.token_empresa;

      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido no cookie' });
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }

      const empresaId = decoded.id;

      // Buscar dados da empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

      if (empresaError) {
        console.error('Erro ao buscar empresa:', empresaError.message);
        return res.status(500).json({ error: 'Erro ao buscar dados da empresa' });
      }

      if (!empresa) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      // Buscar loja da empresa
      const { data: loja, error: lojaError } = await supabase
        .from('loja')
        .select('*')
        .eq('id_empresa', empresaId)
        .single();

      if (lojaError) {
        console.error('Erro ao buscar loja:', lojaError.message);
        return res.status(500).json({ error: 'Erro ao buscar dados da loja' });
      }

      if (!loja) {
        return res.status(404).json({ error: 'Loja não encontrada' });
      }

      // Buscar produtos da loja
      const { data: produtos, error: produtosError } = await supabase
        .from('produto')
        .select('*')
        .eq('id_loja', loja.id);

      if (produtosError) {
        console.error('Erro ao buscar produtos:', produtosError.message);
        return res.status(500).json({ error: 'Erro ao buscar produtos' });
      }

      return res.status(200).json({
        empresa,
        loja,
        produtos: produtos ?? [],
      });

    } catch (error) {
      console.error('Erro inesperado:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
    // NOVO MÉTODO: Para obter o ID da empresa do token
    async getEmpresaIdFromTokenEndpoint(req, res) {
      console.log('DEBUG: DonoController: Chamando getEmpresaIdFromTokenEndpoint!');
      const token = req.cookies?.token_empresa;
      console.log('DEBUG: DonoController: Token recebido para empresa-id:', token ? 'Sim' : 'Não');
  
      if (!token) {
        console.warn('DEBUG: DonoController: Token não fornecido para /dono/empresa-id.');
        // Importante: Não use `redirectTo` aqui no backend. O frontend lida com isso.
        return res.status(401).json({ error: 'Token não fornecido' });
      }
  
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('DEBUG: DonoController: Token decodificado para empresa-id. ID:', decoded.id);
        return res.status(200).json({ empresaId: decoded.id }); // Retorna o ID da empresa
      } catch (err) {
        console.error('DEBUG: DonoController: Erro ao verificar token para /dono/empresa-id:', err.message);
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }
    }
}

export default new DonoController();
