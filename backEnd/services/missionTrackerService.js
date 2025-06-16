// backend/services/missionTrackerService.js
console.log('DEBUG: Tentando carregar missionTrackerService.js');
import supabase from '../src/config/SupaBase.js';
import { getAllActiveMissions, getOwnerMissionProgress, updateMissionProgress, awardBadge } from '../src/models/Mission.js'; // Ajuste o caminho se necessário
// Se você implementar a lógica de XP e tiver uma função como updateOwnerXP em outro modelo (ex: Owner.js), importe-a aqui:
// import { updateOwnerXP } from '../models/Owner.js'; // Exemplo, ajuste o caminho e o nome da função/modelo

const MISSION_RESET_FREQUENCY = {
    daily: 24 * 60 * 60 * 1000, // 24 horas em ms
    weekly: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
    monthly: 30 * 24 * 60 * 60 * 1000, // Aproximadamente 30 dias em ms
    // Adicione outras frequências se precisar
};

export async function trackMissionProgress(ownerId, eventType, value = 1) {
    console.log(`MissionTracker: Rastreiando evento '${eventType}' para dono ${ownerId} com valor ${value}.`);
    try {
        const { data: missions, error: missionsError } = await getAllActiveMissions();
        if (missionsError) {
            console.error('MissionTracker: Erro ao obter missões ativas:', missionsError);
            return;
        }

        const filteredMissions = missions.filter(m => m.type === eventType);

        for (const mission of filteredMissions) {
            const { data: progressData, error: progressError } = await getOwnerMissionProgress(ownerId, mission.id);
            if (progressError) {
                console.error(`MissionTracker: Erro ao obter progresso para missão ${mission.name}:`, progressError);
                continue; // Pula para a próxima missão
            }

            let currentProgress = progressData && progressData.length > 0 ? progressData[0].current_progress : 0;
            let isCompleted = progressData && progressData.length > 0 ? progressData[0].is_completed : false;
            let lastCompletedAt = progressData && progressData.length > 0 ? progressData[0].last_completed_at : null;
            let completedCount = progressData && progressData.length > 0 ? progressData[0].completed_count : 0;

            // Lógica de reset para missões recorrentes
            if (mission.is_recurring && lastCompletedAt && mission.reset_frequency !== 'never') {
                const lastCompletionTime = new Date(lastCompletedAt).getTime();
                const now = new Date().getTime();
                const resetInterval = MISSION_RESET_FREQUENCY[mission.reset_frequency];

                if (resetInterval && (now - lastCompletionTime > resetInterval)) {
                    console.log(`MissionTracker: Resetando missão '${mission.name}' para dono ${ownerId}.`);
                    currentProgress = 0;
                    isCompleted = false; // Resetar o status de completado para o novo ciclo
                }
            }

            // Se a missão já foi completada (e não é recorrente), não faz mais nada para ela neste evento
            if (isCompleted && !mission.is_recurring) {
                console.log(`MissionTracker: Missão '${mission.name}' já completada para dono ${ownerId}. Ignorando atualização.`);
                continue; // Pula para a próxima missão
            }

            // Atualizar progresso apenas se a missão ainda não foi completada no ciclo atual
            // ou se é uma missão recorrente que foi resetada
            if (!isCompleted || (mission.is_recurring && !isCompleted)) {
                 currentProgress += value; // Adiciona o valor do evento
            }
           
            // Garante que o progresso não exceda o target para missões não-recorrentes
            if (!mission.is_recurring && currentProgress > mission.target_value) {
                currentProgress = mission.target_value;
            }

            console.log(`MissionTracker: Missão '${mission.name}' - Progresso atual: ${currentProgress}/${mission.target_value}`);

            let newIsCompleted = currentProgress >= mission.target_value;

            // Se a missão foi recém-completada NESTE evento e não estava completada antes
            if (newIsCompleted && !isCompleted) {
                console.log(`MissionTracker: Missão '${mission.name}' COMPLETADA por dono ${ownerId}!`);
                completedCount += 1;

                // Conceder recompensa
                if (mission.reward_type === 'badge') {
                    const { error: awardError } = await awardBadge(ownerId, mission.reward_value, mission.badge_image_url);
                    if (awardError) console.error(`MissionTracker: Erro ao conceder emblema '${mission.reward_value}':`, awardError);
                } else if (mission.reward_type === 'xp_points') {
                    // Lógica para adicionar XP ao dono (você precisaria implementar updateOwnerXP em seu modelo/serviço Owner.js ou Empresa.js)
                    // Exemplo:
                    // if (typeof updateOwnerXP === 'function') { // Verifique se a função foi importada/está disponível
                    //    const { error: xpError } = await updateOwnerXP(ownerId, mission.reward_value);
                    //    if (xpError) console.error(`MissionTracker: Erro ao adicionar XP ao dono ${ownerId}:`, xpError);
                    // }
                    console.log(`MissionTracker: Adicionando ${mission.reward_value} XP ao dono ${ownerId}.`);
                }
            }
            
            // Salva o progresso atualizado (esta chamada é fora do 'if' de 'recém-completada' para salvar o progresso incremental também)
            await updateMissionProgress(ownerId, mission.id, currentProgress, newIsCompleted, completedCount);
        }
    } catch (err) {
        console.error('MissionTracker: Erro geral no rastreamento de missões:', err);
    }
}