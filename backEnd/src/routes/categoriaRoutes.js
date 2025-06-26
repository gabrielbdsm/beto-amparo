// backend/src/routes/categoriaRoutes.js

import express from 'express';
import { listarCategoriasPorLoja, criarCategoria } from '../controllers/CategoriaController.js';


const router = express.Router();

// Rota para listar categorias de uma loja específica
router.get('/loja/:idLoja', listarCategoriasPorLoja);

// Rota para criar uma nova categoria
router.post('/', criarCategoria); // Acessível via POST /categorias ou /api/categorias, dependendo do app.use

export default router;