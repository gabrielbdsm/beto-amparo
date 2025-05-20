import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function buscarPedidosPorSlug(slug) {
  // Busca a loja com base no slug_loja
  console.log('Buscando loja com slug:', slug);

  const { data: loja, error: lojaError } = await supabase
    .from('loja')
    .select('id')
    .eq('slug_loja', slug)
    .single();

  if (lojaError) throw lojaError;
  if (!loja) throw new Error('Loja não encontrada');

  // Busca os pedidos associados ao id da loja
  const { data: pedidos, error: pedidosError } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id_loja', loja.id);

  if (pedidosError) throw pedidosError;

  return pedidos;
}
