import supabase from '../../config/SupaBase.js';

export const buscarEnderecoCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;



        const { data, error } = await supabase
            .from('enderecos_entrega')
            .select('*')
            .eq('cliente_id', clienteId);




        if (error) throw error;

        if (!data) {
            return res.status(404).json({ message: 'Endereço não encontrado' });
        }

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const salvarEnderecoCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;
        const enderecoData = req.body;

        // Verifica se já existe endereço para este cliente
        const { data: existente } = await supabase
            .from('enderecos_entrega')
            .select('id')
            .eq('cliente_id', clienteId)
            .single();

        let result;

        if (existente) {
            // Atualiza endereço existente
            const { data, error } = await supabase
                .from('enderecos_entrega')
                .update(enderecoData)
                .eq('cliente_id', clienteId)
                .select()
                .single();

            if (error) throw error;
            result = data;

        } else {
            // Cria novo endereço
            const { data, error } = await supabase
                .from('enderecos_entrega')
                .insert([{ ...enderecoData, cliente_id: clienteId }])
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};