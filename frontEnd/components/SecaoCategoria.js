import ProdutoCard from "./ProdutoCard";
import HorizontalScrollContainer from "./HorizontalScrollContainer"; // Importe o novo componente

export default function SecaoCategoria({
    nomeCategoria,
    produtosDaCategoria,
    slug,
    corPrimaria,
    onAdicionar,
    getImagemProduto,
    isLojaClosed,
    quantidades
}) {
    // Se a categoria não tiver produtos (após uma busca, por exemplo), não renderiza nada.
    if (!produtosDaCategoria || produtosDaCategoria.length === 0) {
        return null;
    }

    return (
        <section className="my-8">
            {/* Um div para controlar o padding horizontal de toda a seção */}
            <div className="px-4">
                {/* Título da Categoria - agora sem padding horizontal próprio */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {nomeCategoria}:
                </h2>

                {/* Use o HorizontalScrollContainer para gerenciar a rolagem e as setas */}
                <HorizontalScrollContainer corPrimaria={corPrimaria}>
                    {/* Mapeia os produtos da categoria */}
                    {produtosDaCategoria.map(produto => (
                        <div key={produto.id} className="flex-shrink-0">
                            <ProdutoCard
                                produto={produto}
                                // Certifica-se que 'quantidades[produto.id]' existe, caso contrário usa 1
                                quantidade={quantidades && quantidades.hasOwnProperty(produto.id) ? quantidades[produto.id] : 1}
                                onAdicionar={() => onAdicionar(produto)}
                                getImagemProduto={getImagemProduto}
                                slug={slug}
                                cor={corPrimaria}
                                isIndisponivel={produto.indisponivel_automatico || isLojaClosed}
                                statusEstoque={produto.status_estoque}
                            />
                        </div>
                    ))}
                    {/* Elemento extra para dar um respiro no final do scroll e permitir a visualização total do último item */}
                    <div className="flex-shrink-0 w-4"></div>
                </HorizontalScrollContainer>
            </div>
        </section>
    );
}