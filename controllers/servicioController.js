const ServicioModel = require('../models/servicioModel');

class serviciosController {
  constructor() {
    this.servicioModel = new ServicioModel();
  }

  async obtenerUna(req, res) {
    try {
      const refaccion = await this.servicioModel.obtenerUna(req.params.id);
      if (!refaccion) {
        return res.status(404).json({ message: 'Refaccion no encontrada' });
      }
      res.status(200).json(refaccion);
    } catch (error) {
      console.error('Error al obtener la refaccion:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerTodos(req, res) {
    try {
      const servicios = await this.servicioModel.obtenerTodos();
      res.status(200).json(servicios);
    } catch (error) {
      console.error('Error al obtener los servicios:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
  async serviciosOrden(req, res) {
    try {
      const servicios = await this.servicioModel.serviciosOrden(req.params.id);
      res.status(200).json(servicios);
    } catch (error) {
      console.error('Error al obtener los servicios:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
}

module.exports = new serviciosController();
