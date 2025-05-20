import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export const criarPersonalizacao = async (req, res) => {
  try {
    const { nomeFantasia, corPrimaria, corSecundaria, slogan, fotoLoja, slugLoja } = req.body;

    // Verificar se o slug já existe
    const { data: existingStore, error: checkError } = await supabase
      .from('loja')
      .select('slug_loja')
      .eq('slug_loja', slugLoja)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 significa "nenhum resultado", que é esperado se não existir
      throw checkError;
    }
    if (existingStore) {
      return res.status(400).json({ message: 'Este link já está em uso. Por favor, escolha outro.' });
    }

    // Inserir nova personalização
    const { data, error } = await supabase
      .from('loja')
      .insert({
        nome_fantasia: nomeFantasia,
        cor_primaria: corPrimaria,
        cor_secundaria: corSecundaria,
        slogan: slogan || null, // Permitir nulo se não fornecido
        foto_loja: fotoLoja || null,
        slug_loja: slugLoja,
      })
      .select();

    if (error) throw error;

    return res.status(201).json(data[0]);
  } catch (error) {
    console.error('Erro ao salvar personalização:', error.message);
    return res.status(500).json({ message: 'Erro ao salvar personalização', error: error.message });
  }
};

export const verificarSlug = async (req, res) => {
  try {
    const { slug } = req.query;

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ message: 'Slug inválido. Use apenas letras minúsculas, números e hífens.' });
    }

    const { data, error } = await supabase
      .from('loja')
      .select('slug_loja')
      .eq('slug_loja', slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return res.status(200).json({ exists: !!data, message: data ? 'Este link já está em uso.' : 'Link disponível.' });
  } catch (error) {
    console.error('Erro ao verificar slug:', error.message);
    return res.status(500).json({ message: 'Erro ao verificar slug', error: error.message });
  }
};