exports.logout = (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error('Erro ao encerrar a sessão:', err);
        return res.status(500).json({ message: 'Erro ao fazer logout' });
      }
  
      res.clearCookie('connect.sid'); // nome padrão do cookie de sessão
      return res.status(200).json({ message: 'Logout feito com sucesso' });
    });
  };
  