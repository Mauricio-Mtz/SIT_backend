const RefaccionModel = require('../models/refaccionModel');

class refaccionController {
  constructor() {
    this.refaccionModel = new RefaccionModel();
  }

  async registrar(req, res) {
    try {
      const refaccionId = await this.refaccionModel.registrar(req.body);
      if (refaccionId) {
        res.status(200).json({ message: 'Refacción agregada correctamente', refaccionId });
      } else {
        res.status(401).json({message: "Error al agregar la refacción",});
      }
    } catch (error) {
      console.error('Error al crear la refaccion:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }  

  async obtenerUna(req, res) {
    try {
      const refaccion = await this.refaccionModel.obtenerUna(req.params.id);
      if (!refaccion) {
        return res.status(404).json({ message: 'Refaccion no encontrada' });
      }
      res.status(200).json(refaccion);
    } catch (error) {
      console.error('Error al obtener la refaccion:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async actualizar(req, res) {
    try {
      const updatedRows = await this.refaccionModel.actualizar(req.params.id, req.body);
      if (updatedRows === 0) {
        res.status(401).json({ message: 'Refaccion no encontrada' });
      } else {
        res.status(200).json({ message: 'Refaccion actualizada' });
      }
    } catch (error) {
      console.error('Error al actualizar el refaccion:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async eliminar(req, res) {
    try {
      const deletedRows = await this.refaccionModel.eliminar(req.params.id);
      if (deletedRows === 0) {
        return res.status(401).json({ message: 'refaccion no encontrada' });
      }
      res.status(200).json({ message: 'refaccion eliminada' });
    } catch (error) {
      console.error('Error al eliminar la refaccion:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerTodas(req, res) {
    try {
      const refaccions = await this.refaccionModel.obtenerTodas(req.params.sucursal);
      res.status(200).json(refaccions);
    } catch (error) {
      console.error('Error al obtener las refaccions:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
}

module.exports = new refaccionController();
