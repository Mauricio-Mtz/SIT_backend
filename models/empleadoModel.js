const mysql = require('mysql2/promise');
const dbConfig = require('../config/dbconfig');

class EmpleadoModel {
  constructor() {
    this.connection = null;
  }

  async connect() {
    this.connection = await mysql.createConnection(dbConfig);
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
    }
  }

  async crearEmpleado(empleado) {
    await this.connect();
    const { nombre, apellido, telefono, correo, puesto, sucursal_id, usuario, clave } = empleado;
    try {
      const [result] = await this.connection.execute(
        'INSERT INTO empleado (nombre, apellido, telefono, correo, puesto, sucursal_id, usuario, clave) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nombre, apellido, telefono, correo, puesto, sucursal_id, usuario, clave]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async obtenerEmpleado(id) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        'SELECT * FROM empleado WHERE id = ?',
        [id]
      );
      return results[0];
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async actualizarEmpleado(id, empleado) {
    await this.connect();
    const { nombre, apellido, telefono, correo, puesto, sucursal_id, usuario, clave } = empleado;
    try {
      const [result] = await this.connection.execute(
        'UPDATE empleado SET nombre = ?, apellido = ?, telefono = ?, correo = ?, puesto = ?, sucursal_id = ?, usuario = ?, clave = ? WHERE id = ?',
        [nombre, apellido, telefono, correo, puesto, sucursal_id, usuario, clave, id]
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async eliminarEmpleado(id) {
    await this.connect();
    try {
      const [empleado] = await this.connection.execute(
        'SELECT status FROM empleado WHERE id = ?',
        [id]
      );
      if (empleado.length === 0) {
        throw new Error('Empleado no encontrado');
      }
      const nuevoEstado = empleado[0].status === 1 ? 0 : 1;
      const [result] = await this.connection.execute(
        'UPDATE empleado SET status = ? WHERE id = ?',
        [nuevoEstado, id]
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async obtenerEmpleados() {
    await this.connect();
    try {
      const [results] = await this.connection.execute(`
        SELECT 
          empleado.id, 
          empleado.nombre, 
          empleado.apellido, 
          empleado.telefono, 
          empleado.correo, 
          empleado.clave, 
          empleado.puesto, 
          sucursal.id AS sucursal_id, 
          sucursal.nombre AS sucursal, 
          empleado.usuario,
          empleado.status
        FROM empleado
        JOIN sucursal ON empleado.sucursal_id = sucursal.id
      `);
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
  
}

module.exports = EmpleadoModel;
