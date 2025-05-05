const express = require('express');
const router = express.Router();
const clienteController = require('../src/controllers/clienteController');

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

module.exports = router;