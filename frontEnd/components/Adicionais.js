const Adicionais = ({ adicionais = [], selecionados = {}, toggleAdicional }) => (
  <>
    {adicionais.length > 0 && (
      <>
        {adicionais.map((grupo, index) => (
          <div key={index}>
            <h3 className="font-bold text-center">{grupo.tipo}</h3>

            {grupo.opcoes.map((opcao, idx) => (
              <div
                key={idx}
                className="flex justify-between text-sm py-1 w-full max-w-xs mx-auto"
              >
                <span>{opcao.nome}</span>
                <div className="space-x-2">
                  <span>R${opcao.preco.toFixed(2)}</span>
                  <button
                    onClick={() =>
                      toggleAdicional(opcao.nome, opcao.preco, "-")
                    }
                    className="bg-blue-300 px-2 rounded-full"
                  >
                    -
                  </button>
                  <span>{selecionados[opcao.nome]?.count || 0}</span>
                  <button
                    className="bg-blue-300 px-2 rounded-full"
                    onClick={() =>
                      toggleAdicional(opcao.nome, opcao.preco, "+")
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </>
    )}
  </>
);

export default Adicionais;
