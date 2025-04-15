import express from 'express'
import * as produto from '../controllers/ProdutoController.js'

const router = express.Router()

router.get('/produtos', produto.getProdutos)
router.get('/produto/:id', produto.listarProdutoPorId)
router.post('/addProduto', produto.criarProduto)
router.put('/produto/:id', produto.atualizarProduto)
router.delete('/produto/:id', produto.deletarProduto)
export default router
