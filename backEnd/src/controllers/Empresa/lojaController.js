import { buscarLojaPorSlugCompleta, toggleLojaStatus  } from '../../models/Loja.js';

export const getLojaBySlugAndEmpresaController = async (req, res) => {
    // O ID da empresa vem do middleware `empresaPrivate`
    const empresaId = req.IdEmpresa; // Confere com o que você já está usando

    // O slug da loja virá dos parâmetros da URL, como definido na rota
    // Ex: /empresa/loja/:slugLoja -> req.params.slugLoja
    // Certifique-se de que sua rota captura isso corretamente!
    const slugLoja = req.params.slugLoja; // Use o nome do parâmetro definido na rota, por exemplo, :slugLoja

    console.log("DEBUG: ID da empresa:", empresaId);
    console.log("DEBUG: Slug da loja:", slugLoja);

    if (!empresaId || !slugLoja) {
        return res.status(400).json({ message: "ID da empresa ou slug da loja não fornecidos." });
    }

    try {
        // Usamos a função do modelo que busca a loja pelo slug e depois validamos o ID da empresa
        const { data: loja, error } = await buscarLojaPorSlugCompleta(slugLoja);

        if (error) {
            // Lidar com erros específicos retornados pelo modelo
            if (error.code === 'NOT_FOUND') {
                return res.status(404).json({ message: error.message });
            }
            console.error("Erro ao buscar loja por slug:", error.message);
            return res.status(500).json({ message: "Erro interno do servidor ao buscar a loja." });
        }

        if (!loja) {
            // Este caso já deveria ser tratado pelo 'NOT_FOUND' acima, mas é uma segurança
            return res.status(404).json({ message: "Loja não encontrada para o slug fornecido." });
        }

        // Importante: Verifique se a loja encontrada realmente pertence à empresa logada
        if (loja.id_empresa !== empresaId) {
            return res.status(403).json({ message: "Acesso negado: A loja não pertence à empresa autenticada." });
        }

        // Se tudo estiver certo, retorne os dados da loja
        return res.status(200).json(loja);

    } catch (err) {
        console.error("Erro inesperado no controller ao buscar loja por slug:", err);
        return res.status(500).json({ message: "Erro inesperado do servidor." });
    }
};
export const toggleLojaStatusController = async (req, res) => {
    const { slugLoja } = req.params; // Assume que o slug vem da URL, ex: /loja/ben-burguer/toggle-status
    const { isClosed } = req.body;   // Assume que o novo status (true/false) vem do corpo da requisição

    // Você também pode querer verificar se a loja pertence à empresa logada, usando req.IdEmpresa
    // const empresaId = req.IdEmpresa;
    // const loja = await buscarLojaPorSlugCompleta(slugLoja);
    // if (!loja || loja.id_empresa !== empresaId) { ... return 403 ... }

    if (typeof isClosed !== 'boolean') {
        return res.status(400).json({ message: 'O status isClosed deve ser um valor booleano (true/false).' });
    }

    try {
        const { data, error } = await toggleLojaStatus(slugLoja, isClosed);

        if (error) {
            return res.status(500).json({ message: error });
        }

        return res.status(200).json({
            message: `Status da loja ${data.slug_loja} atualizado para ${data.is_closed_for_orders ? 'Fechada' : 'Aberta'}.`,
            is_closed_for_orders: data.is_closed_for_orders
        });

    } catch (err) {
        console.error("Erro no controller ao alternar status da loja:", err);
        return res.status(500).json({ message: 'Erro interno do servidor ao alternar status da loja.' });
    }
};