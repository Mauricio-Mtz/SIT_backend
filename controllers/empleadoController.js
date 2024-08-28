const EmpleadoModel = require('../models/empleadoModel');

class EmpleadoController {
  constructor() {
    this.empleadoModel = new EmpleadoModel();
  }

  async crearEmpleado(req, res) {
    try {
      const response = await this.empleadoModel.crearEmpleado(req.body);
      
      if (!response.success) {
        return res.status(400).json(response);
      }
      
      res.status(201).json({ message: response.message, empleadoId: response.empleadoId });
    } catch (error) {
      console.error('Error al crear el empleado:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
  

  async obtenerEmpleado(req, res) {
    try {
      const empleado = await this.empleadoModel.obtenerEmpleado(req.params.id);
      if (!empleado) {
        return res.status(404).json({ message: 'Empleado no encontrado' });
      }
      res.status(200).json(empleado);
    } catch (error) {
      console.error('Error al obtener el empleado:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async actualizarEmpleado(req, res) {
    try {
      const response = await this.empleadoModel.actualizarEmpleado(req.params.id, req.body);
      
      if (!response.success) {
        return res.status(400).json(response);
      }
      
      if (response.affectedRows === 0) {
        return res.status(404).json({ message: 'Empleado no encontrado' });
      }
      
      res.status(200).json({ message: response.message });
    } catch (error) {
      console.error('Error al actualizar el empleado:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }  

  async eliminarEmpleado(req, res) {
    try {
      const deletedRows = await this.empleadoModel.eliminarEmpleado(req.params.id);
      if (deletedRows === 0) {
        return res.status(404).json({ message: 'Empleado no encontrado' });
      }
      const message = deletedRows === 1 ? 'Empleado eliminado' : 'Empleado activado';
      res.status(200).json({ message });
    } catch (error) {
      console.error('Error al eliminar el empleado:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerEmpleados(req, res) {
    try {
      const empleados = await this.empleadoModel.obtenerEmpleados();
      res.status(200).json(empleados);
    } catch (error) {
      console.error('Error al obtener los empleados:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
}

module.exports = new EmpleadoController();
