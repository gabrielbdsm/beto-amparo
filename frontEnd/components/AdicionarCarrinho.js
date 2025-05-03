const Carrinho = ({ subtotal, handleAddToCart }) => (
    <div className="text-center font-semibold mt-2 px-6">
      <div className="flex justify-between  text-xl">
        <p> Subtotal: </p> 
        <p >
          {subtotal.toFixed(2)}
        </p>
       </div>
      <button
        onClick={handleAddToCart}
        className="w-60 py-2 my-3 hover:bg-blue-500 bg-blue-300 text-white rounded-4xl font-medium"
      >
        Adicionar no Carrinho
      </button>
    </div>
  );
  
  export default Carrinho;
  