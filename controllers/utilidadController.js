const UtilidadModel = require('../models/utilidadModel');

class UtilidadController {
  constructor() {
    this.utilidadModel = new UtilidadModel();
  }

  async obtenerTodas(req, res) {
    try {
      const utilidades = await this.utilidadModel.obtenerTodas();
      res.status(200).json(utilidades);
    } catch (error) {
      console.error('Error al obtener las utilidades:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
}

module.exports = new UtilidadController();
