import {getLojaByIdEmpresa} from '../../models/Loja.js';

export const getSlugByEmpresaController = async (req , res) => {

    const empresaId = req.IdEmpresa;
    console.log("ID da empresa:", empresaId);

    try{
        const response = await getLojaByIdEmpresa(empresaId);
        const slug = response.data.slug_loja;
     
        if (!slug || slug.length === 0) {
            return res.status(404).json({ message: "Nenhum slug encontrado para esta empresa." });
        }
        return res.status(200).json(slug);  
    }
    catch (err) {
        console.error("Erro ao buscar slug:", err);
        return res.status(500).json({ message: "Erro interno do servidor ao buscar slug." });
    }
  
}