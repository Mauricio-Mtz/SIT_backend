const ClienteModel = require('../models/clienteModel');

class ClienteController {
  constructor() {
    this.clienteModel = new ClienteModel();
  }

  async registrar(req, res) {
    try {
      const clienteId = await this.clienteModel.registrar(req.body);
      res.status(201).json({ message: 'Cliente creado', clienteId });
    } catch (error) {
      console.error('Error al crear el cliente:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerUno(req, res) {
    try {
      const cliente = await this.clienteModel.obtenerUno(req.params.id);
      if (!cliente) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      res.status(200).json(cliente);
    } catch (error) {
      console.error('Error al obtener el cliente:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async actualizar(req, res) {
    try {
      const updatedRows = await this.clienteModel.actualizar(req.params.id, req.body);
      if (updatedRows === 0) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      res.status(200).json({ message: 'Cliente actualizado' });
    } catch (error) {
      console.error('Error al actualizar el cliente:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async eliminar(req, res) {
    try {
      const affectedRows = await this.clienteModel.eliminar(req.params.id);
      if (affectedRows === 0) {
        return res.status(404).json({ message: 'Cliente no encontrado' });
      }
      const message = affectedRows === 1 ? 'Cliente eliminado' : 'Cliente activado';
      res.status(200).json({ message });
    } catch (error) {
      console.error('Error al eliminar o activar el cliente:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerTodos(req, res) {
    try {
      const clientes = await this.clienteModel.obtenerTodos();
      res.status(200).json(clientes);
    } catch (error) {
      console.error('Error al obtener los clientes:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
}

module.exports = new ClienteController();
