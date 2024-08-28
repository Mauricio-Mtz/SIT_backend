const mysql = require('mysql2/promise');
const dbConfig = require('../config/dbconfig');

class ClienteModel {
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

  async registrar(cliente) {
    await this.connect();
    const { nombre, apellido, telefono, correo, direccion } = cliente;
    try {
      const [result] = await this.connection.execute(
        'INSERT INTO cliente (nombre, apellido, telefono, correo, direccion) VALUES (?, ?, ?, ?, ?)',
        [nombre, apellido, telefono, correo, direccion]
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
        'SELECT * FROM cliente WHERE id = ?',
        [id]
      );
      return results[0];
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async actualizar(id, cliente) {
    await this.connect();
    const { folio, nombre, apellido, telefono, correo, contrasena, direccion } = cliente;
    try {
      const [result] = await this.connection.execute(
        'UPDATE cliente SET folio = ?, nombre = ?, apellido = ?, telefono = ?, correo = ?, contrasena = ?, direccion = ? WHERE id = ?',
        [folio, nombre, apellido, telefono, correo, contrasena, direccion, id]
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
      const [cliente] = await this.connection.execute(
        'SELECT status FROM cliente WHERE id = ?',
        [id]
      );
      if (cliente.length === 0) {
        throw new Error('Cliente no encontrado');
      }
      const nuevoEstado = cliente[0].status === 1 ? 0 : 1;
      const [result] = await this.connection.execute(
        'UPDATE cliente SET status = ? WHERE id = ?',
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
      const [results] = await this.connection.execute('SELECT * FROM cliente');
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = ClienteModel;
