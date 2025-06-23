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
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: --- INICIANDO getOwnerAchievements ---');

        const ownerId = req.Id; // ID da empresa logada (do middleware routePrivate)
        if (!ownerId) {
            console.error('DEBUG_ACHIEVEMENT_CONTROLLER: ERRO: ID do dono não encontrado na requisição (req.Id).');
            return res.status(401).json({ error: 'ID da empresa não disponível. Autenticação falhou.' });
        }
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: ID do dono (empresa) obtido:', ownerId);

        const { slugLoja } = req.params; // <-- MUDANÇA AQUI: Obter slugLoja dos parâmetros da URL
        if (!slugLoja) {
            console.error('DEBUG_ACHIEVEMENT_CONTROLLER: ERRO: Slug da loja não fornecido na rota.');
            return res.status(400).json({ mensagem: 'Slug da loja é obrigatório para buscar conquistas.' });
        }
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: Slug da loja recebido:', slugLoja);


        // BUSCAR LOJA ESPECÍFICA PELO SLUG (para obter o ID da loja)
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: Buscando loja específica pelo slug...');
        const { data: lojaDoContexto, error: lojaError } = await LojaModel.buscarLojaPorSlugCompleta(slugLoja);
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: Resultado de buscarLojaPorSlugCompleta: data=', lojaDoContexto, 'error=', lojaError);

        if (lojaError || !lojaDoContexto) {
            console.error('DEBUG_ACHIEVEMENT_CONTROLLER: ERRO: Loja não encontrada para o slug fornecido.');
            return res.status(404).json({ mensagem: 'Loja não encontrada para o slug fornecido.' });
        }
        
        // **Verificação de Autorização Adicional:** A loja do slug deve pertencer ao dono logado
        if (lojaDoContexto.id_empresa !== ownerId) {
            console.warn('DEBUG_ACHIEVEMENT_CONTROLLER: ACESSO NEGADO: Loja do slug não pertence ao dono autenticado.');
            return res.status(403).json({ mensagem: 'Acesso negado. A loja não pertence à sua conta.' });
        }

        const lojaId = lojaDoContexto.id; // <-- ESTE É O ID DA LOJA CORRETA
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: ID da loja do contexto:', lojaId);

        // FETCH ACHIEVEMENTS (DEFINIÇÕES DAS MISSÕES)
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: Buscando definições de conquistas na tabela "achievements"...');
        const { data: allAchievements, error: achievementsError } = await supabase
            .from('achievements')
            .select('*');
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: Resultado da busca de "achievements": data.length=', allAchievements?.length, 'error=', achievementsError);

        if (achievementsError) {
            console.error('DEBUG_ACHIEVEMENT_CONTROLLER: ERRO: Falha ao buscar definições de conquistas:', achievementsError.message, achievementsError.stack);
            throw new Error('Erro ao buscar conquistas do banco de dados.');
        }
        if (!allAchievements) allAchievements = [];

        // FETCH OWNER'S PROGRESS (PROGRESSO DA LOJA NAS MISSÕES)
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: Buscando progresso das conquistas para a loja:', lojaId);
        const { data: ownerProgress, error: progressError } = await supabase
            .from('owner_achievements')
            .select('*')
            .eq('loja_id', lojaId); // <-- USANDO O ID DA LOJA DO CONTEXTO AQUI
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: Resultado da busca de "owner_achievements": data.length=', ownerProgress?.length, 'error=', progressError);

        if (progressError) {
            console.error('DEBUG_ACHIEVEMENT_CONTROLLER: ERRO: Falha ao buscar progresso das conquistas:', progressError.message, progressError.stack);
            throw new Error('Erro ao buscar progresso das conquistas.');
        }
        if (!ownerProgress) ownerProgress = [];

        // COMBINAR DADOS
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: Combinando dados de conquistas e progresso...');
        const combinedData = allAchievements.map(mission => {
            const progress = ownerProgress.find(p => p.achievement_id === mission.id);
            return {
                ...mission,
                current_progress: progress ? progress.current_progress : 0,
                completed_at: progress ? progress.completed_at : null,
                is_completed: progress ? progress.current_progress >= mission.goal : false
            };
        });
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: Dados combinados. Total de itens:', combinedData.length);

        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: Enviando resposta 200 OK.');
        return res.status(200).json(combinedData);

    } catch (error) {
        console.error('DEBUG_ACHIEVEMENT_CONTROLLER: ERRO CRÍTICO INESPERADO no controlador:', error.message, error.stack);
        return res.status(500).json({ mensagem: 'Erro interno ao buscar conquistas.', detalhes: error.message });
    } finally {
        console.log('DEBUG_ACHIEVEMENT_CONTROLLER: --- FINALIZANDO getOwnerAchievements ---');
    }
};