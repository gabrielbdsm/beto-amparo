import express from 'express';
import * as produto from '../controllers/ProdutoController.js';
import multer from 'multer';
import path from 'path';
import { listarProdutosPorEmpresa } from "../controllers/ProdutoController.js";

const router = express.Router();


const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Limite de 50MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(file.originalname.toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'), false);
    }
  },
});

// Rotas
router.get('/produtos', produto.getProdutos);
router.get('/produto/:id', produto.listarProdutoPorId);
router.post('/addProduto', upload.single('imagem'), produto.criarProduto); 
router.put('/produto/:id', produto.atualizarProduto);
router.delete('/produto/:id', produto.deletarProduto);
router.get("/produtos/empresa/:empresaId", listarProdutosPorEmpresa);

export default router;
