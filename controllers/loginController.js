const LoginModel = require('../models/loginModel');

class LoginController {
  constructor() {
    this.loginModel = new LoginModel();
  }

  async login(req, res) {
    const { usuario, clave } = req.body;

    try {
      const usuarioEncontrado = await this.loginModel.buscarEmpleado(usuario, clave);

      if (!usuarioEncontrado) {
        return res.status(401).json({
          message: "Credenciales inválidas",
        });
      }

      res.status(200).json({
        message: "Usuario encontrado",
        data: usuarioEncontrado,
      });
    } catch (error) {
      console.error("Error al buscar el usuario:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
}

module.exports = new LoginController();
