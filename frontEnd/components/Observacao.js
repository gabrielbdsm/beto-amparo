export const Obersevacao = ({ produto }) => (
    <div className="flex flex-col px-6 justify-center mt-4">
        <h2 className="text-lg font-semibold mb-2 text-black">Observações</h2> {/* Adicionado text-black aqui */}
        <textarea
        className="w-full h-20 p-2 border border-gray-300 rounded-lg text-black" // Já havíamos adicionado aqui
        placeholder="Digite suas observações aqui..."
        ></textarea>
    </div>
)