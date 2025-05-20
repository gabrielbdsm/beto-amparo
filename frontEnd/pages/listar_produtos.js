document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Busca os produtos do seu endpoint (que já existe no controller)
        const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/produtos`,{
            mode: 'cors'
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const produtos = await response.json();
        const container = document.getElementById('produtos-container');
        
        // 2. Verifica se há produtos
        if (!produtos || produtos.length === 0) {
            container.innerHTML = '<p>Nenhum produto cadastrado ainda.</p>';
            return;
        }
        
        // 3. Renderiza cada produto
        container.innerHTML = produtos.map(produto => `
            <div class="produto-card">
                ${produto.image ? 
                    `<img src="/uploads/${produto.image}" alt="${produto.nome}" class="produto-imagem">` : 
                    `<div style="height:180px; display:flex; align-items:center; justify-content:center; color:#777;">Sem imagem</div>`
                }
                <h3 class="produto-nome">${produto.nome}</h3>
                <span class="produto-categoria">${formatarCategoria(produto.categoria)}</span>
                <p class="produto-preco">${formatarPreco(produto.preco)}</p>
                ${produto.descricao ? `<p>${produto.descricao}</p>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        document.getElementById('produtos-container').innerHTML = 
            '<p>Ocorreu um erro ao carregar os produtos. Recarregue a página.</p>';
    }
});

// Função para formatar a categoria
function formatarCategoria(categoria) {
    const categorias = {
        'alimento': 'Alimento',
        'higiene': 'Higiene',
        'roupa': 'Roupa'
    };
    return categorias[categoria] || categoria;
}

// Função para formatar o preço
function formatarPreco(preco) {
    return preco.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}