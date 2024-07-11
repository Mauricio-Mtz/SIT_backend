const fs = require('fs');
const path = require('path');
const VehiculoModel = require('../models/vehiculoModel');

class VehiculoController {
  constructor() {
    this.vehiculoModel = new VehiculoModel();
  }

  async vehiculosCliente(req, res) {
    try {
      const vehiculos = await this.vehiculoModel.vehiculosCliente(req.params.id);
      res.status(200).json(vehiculos);
    } catch (error) {
      console.error('Error al obtener los vehiculos:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

}

module.exports = new VehiculoController();
