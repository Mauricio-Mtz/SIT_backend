const mysql = require('mysql2/promise');
const dbConfig = require('../config/dbconfig');

class ProveedorModel {
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

  async registrar(proveedor) {
    await this.connect();
    const { nombre, telefono, correo } = proveedor;
    try {
      const [result] = await this.connection.execute(
        'INSERT INTO proveedor (nombre, telefono, correo) VALUES (?, ?, ?)',
        [nombre, telefono, correo]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async obtenerUno(id) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        'SELECT * FROM proveedor WHERE id = ?',
        [id]
      );
      return results[0];
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async actualizar(id, proveedor) {
    await this.connect();
    const { nombre, telefono, correo } = proveedor;
    try {
      const [result] = await this.connection.execute(
        'UPDATE proveedor SET nombre = ?, telefono = ?, correo = ? WHERE id = ?',
        [nombre, telefono, correo, id]
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async eliminar(id) {
    await this.connect();
    try {
      const [proveedor] = await this.connection.execute(
        'SELECT status FROM proveedor WHERE id = ?',
        [id]
      );
      if (proveedor.length === 0) {
        throw new Error('Proveedor no encontrado');
      }
      const nuevoEstado = proveedor[0].status === 1 ? 0 : 1;
      const [result] = await this.connection.execute(
        'UPDATE proveedor SET status = ? WHERE id = ?',
        [nuevoEstado, id]
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async obtenerTodos() {
    await this.connect();
    try {
      const [results] = await this.connection.execute('SELECT * FROM proveedor');
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = ProveedorModel;
