import supabase from '../../config/SupaBase.js';
import dotenv from 'dotenv';
import * as lojaModel from '../../models/Loja.js';
dotenv.config();

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

export const getLojaBySlug = async (req, res) => {
  try {
      const { slug } = req.params;
      console.log('Controller: getLojaBySlug recebido para slug:', slug); // <-- NOVO LOG

      if (!slug) {
          return res.status(400).json({ mensagem: 'Slug da loja não fornecido.' });
      }

      // Chama a função do modelo para buscar a loja completa
      const { data: loja, error: modelError } = await lojaModel.buscarLojaPorSlugCompleta(slug);
      console.log('Controller: Resultado de buscarLojaPorSlugCompleta:', loja, modelError); // <-- NOVO LOG

      if (modelError) {
          // Se o modelo retornou um erro (que não seja "não encontrado")
          console.error('PersonalizacaoController: Erro do modelo ao buscar loja:', modelError);
          // Você pode decidir enviar uma mensagem de erro mais genérica aqui
          return res.status(500).json({ mensagem: 'Erro ao buscar dados da loja.', erro: modelError });
      }

      if (!loja) {
          // Se o modelo retornou data: null (loja não encontrada)
          console.log('PersonalizacaoController: Loja não encontrada para o slug:', slug);
          return res.status(404).json({ mensagem: 'Loja não encontrada com o identificador fornecido.' });
      }

      // Se a loja foi encontrada, o objeto 'loja' já contém todos os campos
      // selecionados em buscarLojaPorSlugCompleta ('id', 'nome_fantasia', 'foto_loja', etc.).
      // Basta retornar o objeto 'loja' completo.
      console.log('PersonalizacaoController: Loja encontrada, retornando dados.');
      return res.status(200).json(loja); // Retorna o objeto completo da loja

  } catch (err) {
      console.error('PersonalizacaoController: Erro inesperado em getLojaBySlug:', err.message);
      return res.status(500).json({ mensagem: 'Erro interno do servidor.', erro: err.message });
  }
};

