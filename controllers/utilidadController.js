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

  async obtenerVentasPorPeriodo(req, res) {
    const { sucursal_id, fecha_inicio, fecha_fin } = req.body; // Recibimos el ID de la sucursal y las fechas
    try {
      const ventas = await this.utilidadModel.obtenerVentasPorPeriodo(sucursal_id, fecha_inicio, fecha_fin);
      res.status(200).json(ventas);
    } catch (error) {
      console.error("Error al obtener las ventas por periodo:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
  
}

module.exports = new UtilidadController();
