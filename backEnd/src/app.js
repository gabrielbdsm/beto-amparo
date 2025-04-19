import express from 'express';
import dotenv from 'dotenv';
import empresaRoutes from './routes/empresaRoutes.js';
import produtosRoutes from './routes/produtosRoutes.js'; 
import logoutRoutes from './routes/logoutRoutes.js';
import cors from "cors";

dotenv.config();
const app = express();


app.use(express.json())

app.use(cors({
  origin: 'http://127.0.0.1:5500' 
}));


app.use(empresaRoutes);  
app.use(produtosRoutes);

app.use(logoutRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Clique no link para abrir: http://localhost:${PORT}`);
});
app.get('/', (req, res) => {
  res.send('API do Beto Amparo está no ar!');
});
