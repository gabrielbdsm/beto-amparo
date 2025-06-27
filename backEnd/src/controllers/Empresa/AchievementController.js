// backend/controllers/Empresa/AchievementController.js

import supabase from '../../config/SupaBase.js';
import * as LojaModel from '../../models/Loja.js'; // Importação do LojaModel
import jwt from 'jsonwebtoken';

// Função auxiliar getEmpresaIdFromToken (mantida por segurança se precisar dela em outros pontos)
async function getEmpresaIdFromToken(req) {
    const token = req.cookies?.token_empresa;
    if (!token) return { error: { message: 'Token não fornecido no cookie' } };
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { empresaId: decoded.id };
    } catch (err) {
        return { error: { message: 'Token inválido ou expirado' } };
    }
}

export const getOwnerAchievements = async (req, res) => {
    try {
        const ownerId = req.Id; // ID da empresa logada (do middleware routePrivate)
        if (!ownerId) {
            return res.status(401).json({ error: 'ID da empresa não disponível. Autenticação falhou.' });
        }

        const { slugLoja } = req.params; // Obter slugLoja dos parâmetros da URL
        if (!slugLoja) {
            return res.status(400).json({ mensagem: 'Slug da loja é obrigatório para buscar conquistas.' });
        }

        // BUSCAR LOJA ESPECÍFICA PELO SLUG (para obter o ID da loja)
        const { data: lojaDoContexto, error: lojaError } = await LojaModel.buscarLojaPorSlugCompleta(slugLoja);

        if (lojaError || !lojaDoContexto) {
            return res.status(404).json({ mensagem: 'Loja não encontrada para o slug fornecido.' });
        }
        
        // Verificação de Autorização Adicional: A loja do slug deve pertencer ao dono logado
        if (lojaDoContexto.id_empresa !== ownerId) {
            return res.status(403).json({ mensagem: 'Acesso negado. A loja não pertence à sua conta.' });
        }

        // CORREÇÃO AQUI: Removido o 'Do' duplicado
        const lojaId = lojaDoContexto.id; 

        // FETCH ACHIEVEMENTS (DEFINIÇÕES DAS MISSÕES)
        const { data: allAchievements, error: achievementsError } = await supabase
            .from('achievements')
            .select('*');

        if (achievementsError) {
            throw new Error('Erro ao buscar conquistas do banco de dados.');
        }
        if (!allAchievements) allAchievements = [];

        // FETCH OWNER'S PROGRESS (PROGRESSO DA LOJA NAS MISSÕES)
        const { data: ownerProgress, error: progressError } = await supabase
            .from('owner_achievements')
            .select('*')
            .eq('loja_id', lojaId); // USANDO O ID DA LOJA DO CONTEXTO AQUI

        if (progressError) {
            throw new Error('Erro ao buscar progresso das conquistas.');
        }
        if (!ownerProgress) ownerProgress = [];

        // COMBINAR DADOS
        const combinedData = allAchievements.map(mission => {
            const progress = ownerProgress.find(p => p.achievement_id === mission.id);
            return {
                ...mission,
                current_progress: progress ? progress.current_progress : 0,
                completed_at: progress ? progress.completed_at : null,
                is_completed: progress ? progress.current_progress >= mission.goal : false
            };
        });

        return res.status(200).json(combinedData);

    } catch (error) {
        // Manteve o retorno de erro 500, mas sem o console.error de debug
        return res.status(500).json({ mensagem: 'Erro interno ao buscar conquistas.', detalhes: error.message });
    }
};