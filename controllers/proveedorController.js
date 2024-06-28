const ProveedorModel = require('../models/proveedorModel');

class ProveedorController {
  constructor() {
    this.proveedorModel = new ProveedorModel();
  }

  async registrar(req, res) {
    try {
      const proveedorId = await this.proveedorModel.registrar(req.body);
      res.status(201).json({ message: 'Proveedor creado', proveedorId });
    } catch (error) {
      console.error('Error al crear el proveedor:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerUno(req, res) {
    try {
      const proveedor = await this.proveedorModel.obtenerUno(req.params.id);
      if (!proveedor) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }
      res.status(200).json(proveedor);
    } catch (error) {
      console.error('Error al obtener el proveedor:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async actualizar(req, res) {
    try {
      const updatedRows = await this.proveedorModel.actualizar(req.params.id, req.body);
      if (updatedRows === 0) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }
      res.status(200).json({ message: 'Proveedor actualizado' });
    } catch (error) {
      console.error('Error al actualizar el proveedor:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async eliminar(req, res) {
    try {
      const affectedRows = await this.proveedorModel.eliminar(req.params.id);
      if (affectedRows === 0) {
        return res.status(404).json({ message: 'Proveedor no encontrado' });
      }
      const message = affectedRows === 1 ? 'Proveedor eliminado' : 'Proveedor activado';
      res.status(200).json({ message });
    } catch (error) {
      console.error('Error al eliminar o activar el proveedor:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerTodos(req, res) {
    try {
      const proveedores = await this.proveedorModel.obtenerTodos();
      res.status(200).json(proveedores);
    } catch (error) {
      console.error('Error al obtener los proveedores:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
}

module.exports = new ProveedorController();
