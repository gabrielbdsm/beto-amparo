import supabase from '../config/SupaBase.js';

const bucket = "imagens";

export async function salvarImagem(buffer, originalName, mimetype, UUID) {
    const pasta = `clientes/${UUID}`;
    const nomeFinal = `${pasta}/${originalName}-${Date.now()}`;
  
    const { error } = await supabase.storage
      .from(bucket)
      .upload(nomeFinal, buffer, { contentType: mimetype });
  
    if (error) throw new Error("Erro ao salvar imagem: " + error.message);
  
    const { data } = supabase.storage.from(bucket).getPublicUrl(nomeFinal);
    return data.publicUrl;
  }

export async function deletarImagem(path) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error("Erro ao deletar imagem: " + error.message);
}

export async function getUrlImagem(path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}


