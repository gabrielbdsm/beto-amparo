// src/routes/clienteRoutes.js
import express from 'express';
import clienteController from '../controllers/clienteController.js';
const router = express.Router();

// Middleware específico para estas rotas
router.use((req, res, next) => {
  console.log(`Recebida requisição para: ${req.method} ${req.path}`);
  next();
});

// Rota para cadastrar cliente
router.post('/clientes', clienteController.cadastrar);  // Ajuste aqui para '/clientes'

// Rota para listar clientes (opcional)
router.get('/clientes', clienteController.listar);  // Ajuste aqui para '/clientes'

// Rota para obter cliente por ID (opcional)
router.get('/clientes/:id', clienteController.obterPorId);  // Ajuste aqui para '/clientes/:id'

// Rota para atualizar cliente (opcional)
router.put('/clientes/:id', clienteController.atualizar);  // Ajuste aqui para '/clientes/:id'

// Rota para deletar cliente (opcional)
router.delete('/clientes/:id', clienteController.remover);  // Ajuste aqui para '/clientes/:id'

// Exportação ES Module
export default router;
