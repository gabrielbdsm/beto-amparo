import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://SEU_URL.supabase.co', 'SEU_PUBLIC_KEY');

function GraficoPedidosPorDia({ empresaId }) {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    async function buscarDados() {
      const { data, error } = await supabase
        .from('pedido')
        .select('id, data_pedido')
        .eq('empresa_id', empresaId); // filtra por empresa

      if (error) return console.error(error);

      // Processar dados: contar pedidos por dia
      const contagem = {};
      data.forEach(pedido => {
        const dia = new Date(pedido.data_pedido).toLocaleDateString();
        contagem[dia] = (contagem[dia] || 0) + 1;
      });

      const formatado = Object.entries(contagem).map(([dia, total]) => ({
        dia,
        total,
      }));

      setDados(formatado);
    }

    buscarDados();
  }, [empresaId]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={dados}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="dia" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="total" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default GraficoPedidosPorDia;
