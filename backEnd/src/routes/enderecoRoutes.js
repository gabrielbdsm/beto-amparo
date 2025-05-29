import express from 'express';
import { 
    buscarEnderecoCliente,
    salvarEnderecoCliente
} from '../controllers/client/enderecoController.js';
import { authCliente } from '../middleware/authClienteMiddleware.js';

const router = express.Router();

router.get('/clientes/:clienteId/endereco', authCliente, buscarEnderecoCliente);
router.post('/clientes/:clienteId/endereco', authCliente, salvarEnderecoCliente);

export default router;