// src/routes/clienteRoutes.js
import express from 'express';
import clienteController from '../controllers/clienteController.js';
//import * as cliente from '../controllers/clienteController.js';
//import * as clienteController from '../controllers/clienteController.js';
const router = express.Router();

// Middleware específico para estas rotas
router.use((req, res, next) => {
  console.log(`Recebida requisição para: ${req.method} ${req.path}`);
  next();
});

// Rota para cadastrar cliente
router.post('/', clienteController.cadastrar);

// Rota para listar clientes (opcional)
router.get('/', clienteController.listar);

// Rota para obter cliente por ID (opcional)
router.get('/:id', clienteController.obterPorId);

// Rota para atualizar cliente (opcional)
router.put('/:id', clienteController.atualizar);

// Rota para deletar cliente (opcional)
router.delete('/:id', clienteController.remover);

// Exportação ES Module
export default router;