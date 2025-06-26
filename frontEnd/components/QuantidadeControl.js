const QuantidadeControl = ({ produto, quantidade, setQuantidade }) => (
  <div className="flex  items-center justify-between ">
      <div className="flex items-center">
        <span className="text-2xl font-bold text-blue-300">
          R${
          produto.preco.toFixed(2)}
        </span>
        {produto.desconto  && 
        <span className="text-sm line-through text-blue-300 ml-2">
          R${produto.preco.toFixed(2) * (1 -  produto.desconto/100)}
        </span>}
      </div>
    
    <div className="flex space-x-3">
      <button
        onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
        className="px-3 hover:bg-blue-500 bg-blue-300 rounded-full text-white text-3xl"
      >
        -
      </button>
      <span className="text-2xl font-medium">{quantidade}</span>
      <button
        onClick={() => setQuantidade((q) => q + 1)}
        className="px-2 hover:bg-blue-500 bg-blue-300 rounded-full text-white text-3xl"
      >
        +
      </button>
    </div>
  </div>
);

export default QuantidadeControl;
