import express from 'express';
import dotenv from 'dotenv';
import empresaRoutes from './routes/empresaRoutes.js';
import produtosRoutes from './routes/produtosRoutes.js';  
import cors from "cors";

dotenv.config();
const app = express();


app.use(express.json())

app.use(cors())

app.use(empresaRoutes);  
app.use(produtosRoutes);

app.listen(process.env.PORT, ()=>{
  console.log( `Clique no link para abrir: http://localhost:${process.env.PORT}`);
})