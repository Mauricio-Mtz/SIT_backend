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
    
    const response = {
      success: false,
      message: '',
      details: [],
    };
  
    try {
      // Verificar duplicados
      const [existingClient] = await this.connection.execute(
        'SELECT correo, telefono FROM cliente WHERE correo = ? OR telefono = ?',
        [correo, telefono]
      );
  
      if (existingClient.length > 0) {
        if (existingClient[0].correo === correo) {
          response.details.push('El correo ya está en uso.');
        }
        if (existingClient[0].telefono === telefono) {
          response.details.push('El teléfono ya está en uso.');
        }
        
        response.message = 'Validación fallida';
        return response;
      }
  
      // Si no hay duplicados, proceder con la inserción
      const [result] = await this.connection.execute(
        'INSERT INTO cliente (nombre, apellido, telefono, correo, direccion) VALUES (?, ?, ?, ?, ?)',
        [nombre, apellido, telefono, correo, direccion]
      );
  
      response.success = true;
      response.message = 'Cliente registrado exitosamente';
      response.clienteId = result.insertId;
  
      return response;
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
    
    const response = {
      success: false,
      message: '',
      details: [],
    };
  
    try {
      // Verificar duplicados excluyendo el cliente actual
      const [existingClient] = await this.connection.execute(
        'SELECT correo, telefono FROM cliente WHERE (correo = ? OR telefono = ?) AND id != ?',
        [correo, telefono, id]
      );
  
      if (existingClient.length > 0) {
        if (existingClient[0].correo === correo) {
          response.details.push('El correo ya está en uso.');
        }
        if (existingClient[0].telefono === telefono) {
          response.details.push('El teléfono ya está en uso.');
        }
        
        response.message = 'Validación fallida';
        return response;
      }
  
      // Si no hay duplicados, proceder con la actualización
      const [result] = await this.connection.execute(
        'UPDATE cliente SET folio = ?, nombre = ?, apellido = ?, telefono = ?, correo = ?, contrasena = ?, direccion = ? WHERE id = ?',
        [folio, nombre, apellido, telefono, correo, contrasena, direccion, id]
      );
  
      response.success = true;
      response.message = 'Cliente actualizado exitosamente';
      response.affectedRows = result.affectedRows;
  
      return response;
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
