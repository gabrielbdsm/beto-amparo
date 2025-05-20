import express from 'express';
import * as produto from '../controllers/produto/ProdutoController.js';
import multer from 'multer';
import path from 'path';
import { listarProdutosPorLoja } from "../controllers/produto/ProdutoController.js";
import {routePrivate}  from '../middleware/sessionEmpresa.js';
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
router.post('/addProduto',routePrivate, upload.single('imagem'), produto.criarProduto); 
router.put('/produto/:id',routePrivate, produto.atualizarProduto);
router.delete('/produto/:id',routePrivate, produto.deletarProduto);
router.get("/produtos/empresa/:empresaId", listarProdutosPorLoja);
router.get("/produtos/loja/:lojaId", listarProdutosPorLoja);
export default router;
