export const validarProduto = (dados) => {
    const erros = [];
  
    if (!dados.nome?.trim()) erros.push('O nome do produto é obrigatório.');
    if (!dados.image?.trim()) erros.push('A imagem do produto é obrigatória.');
    if (!dados.descricao?.trim()) erros.push('A descrição do produto é obrigatória.');
    if (typeof dados.preco !== 'number' || dados.preco <= 0) erros.push('O preço deve ser um número positivo.');
  
    if (dados.novaCategoria) {
      if (!dados.novaCategoriaTexto?.trim()) erros.push('Texto da nova categoria é obrigatório.');
    } else {
      if (!dados.categoria?.trim()) erros.push('A categoria do produto é obrigatória.');
    }
  
    return erros.length > 0
      ? { valido: false, erros }
      : { valido: true, erros: null };
  };
  