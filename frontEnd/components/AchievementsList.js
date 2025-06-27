// frontend/components/AchievementsList.js
import React, { useEffect, useState } from 'react';
import Image from 'next/image'; // Importe o componente Image do Next.js

export default function AchievementsList({ ownerSlug }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAchievements = async () => {
      setLoading(true);
      setError(null); // Limpa erros anteriores ao tentar buscar novamente
      try {
        // --- MUDANÇA CRÍTICA AQUI: Incluir ownerSlug na URL ---
        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/empresa/${ownerSlug}/achievements`, {
          credentials: 'include', // Para enviar cookies de autenticação
        });

        if (response.status === 401) {
          window.location.href = '/empresa/LoginEmpresa'; // Exemplo de redirecionamento
          return; // Importante para parar a execução após o redirecionamento
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.mensagem || `Erro HTTP! Status: ${response.status}`);
        }

        const data = await response.json();
        setAchievements(data);
      } catch (err) {
        setError(err.message || "Erro ao carregar conquistas.");
      } finally {
        setLoading(false);
      }
    };

    if (ownerSlug) { // Apenas executa o fetch se ownerSlug tiver um valor
      fetchAchievements();
    }
  }, [ownerSlug]); // O useEffect re-executará se ownerSlug mudar

  if (loading) {
    return <p className="text-gray-700">Carregando missões...</p>;
  }
  if (error) {
    return <p className="text-red-500">Erro: {error}</p>;
  }
  if (achievements.length === 0) {
    return <p className="text-gray-700">Nenhuma missão disponível no momento.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* O texto "Suas Missões e Conquistas" agora é explicitamente preto */}
      <h3 className="text-xl font-semibold mb-4 text-gray-900">Suas Missões e Conquistas</h3>
      <div className="space-y-4">
        {achievements.map((mission) => (
          <div key={mission.id} className="flex items-center space-x-4 bg-gray-50 p-3 rounded-md border border-gray-200">
            {mission.badge_image_url && (
              // Contêiner da imagem: Adicionado 'text-black' para que SVGs com fill="currentColor" herdem esta cor
              <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-full overflow-hidden text-black">
                <Image
                  src={mission.badge_image_url}
                  alt={mission.name}
                  layout="fill"
                  objectFit="contain"
                  // Removida a classe 'filter-black' daqui, pois não é necessária se o SVG usar currentColor
                  // ou se o filtro for aplicado de outra forma.
                  unoptimized={mission.badge_image_url.endsWith('.svg')} // Mantenha esta linha se quiser desativar otimização para SVGs
                />
              </div>
            )}
            <div className="flex-grow">
              <h4 className="font-bold text-lg text-gray-800">{mission.name}</h4>
              <p className="text-gray-600 text-sm">{mission.description}</p>

              {/* Barra de Progresso ATUALIZADA */}
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                  className={`h-2.5 rounded-full ${mission.is_completed ? 'bg-green-500' : 'bg-blue-500'}`}
                  // AQUI ESTÁ A MUDANÇA: Usando Math.min para limitar a largura a 100%
                  style={{ width: `${Math.min((mission.current_progress / mission.goal) * 100, 100)}%` }}
                ></div>
              </div>
              {/* MUDANÇA AQUI: Sintaxe da linha de progresso e data de conclusão REVISADA */}
              <p className="text-gray-500 text-xs mt-1">
                Progresso: {mission.current_progress}/{mission.goal}
                {/* Condicional para texto de conclusão/em andamento */}
                {mission.is_completed ? ( // Se a missão está concluída
                  mission.completed_at ? ( // E se tem data de conclusão
                    ` (Concluído em: ${new Date(mission.completed_at).toLocaleDateString('pt-BR')})`
                  ) : ( // Se está concluída, mas sem data (deve ser rara)
                    ' (Concluído!)'
                  )
                ) : ( // Se a missão NÃO está concluída (está em andamento)
                  ' (Em andamento)'
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}