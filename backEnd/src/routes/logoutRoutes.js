import express from 'express';

const router = express.Router();

// Rota para logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erro ao encerrar a sessão:', err);
      return res.status(500).json({ message: 'Erro ao sair' });
    }

    // Opcional: limpa o cookie de sessão se estiver usando
    res.clearCookie('connect.sid'); // ou o nome da sua session cookie
    res.status(200).json({ message: 'Logout bem-sucedido' });
  });
});

export default router;
