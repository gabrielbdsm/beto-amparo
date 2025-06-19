import supabase from '../config/SupaBase.js';


export const buscarAgendamentosPorEmpresa = async (empresaId) => {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('id_empresa', empresaId);
    console.log(empresaId)
  if (error) {
    throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
  }

  return data;
}

export const deletarAgendamentoPorId = async (date , time, empresaId , id_cliente) => {
  const { data, error } = await supabase
    .from('agendamentos')
    .delete()
    .eq('data', date)
    .eq('time', time)
    .eq('id_empresa', empresaId)
    .eq('id_cliente', id_cliente)
    .select();

  if (error) {
    throw new Error(`Erro ao deletar agendamento: ${error.message}`);
  }

  return data;
}
export const updateAgendamentoController = async (date, time, empresaId, status, id_cliente) => {
  const { data, error } = await supabase
    .from('agendamentos')
    .update({ status })
    .eq('data', date)
    .eq('time', time)
    .eq('id_empresa', empresaId)
    .eq('id_cliente', id_cliente)
    .select();

  if (error) {
    throw new Error(`Erro ao atualizar agendamento: ${error.message}`);
  }

  return data;
}