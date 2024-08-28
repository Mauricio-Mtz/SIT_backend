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
    
    const response = {
      success: false,
      message: '',
      details: [],
    };
    
    try {
      // Verificar duplicados
      const [existingEmployee] = await this.connection.execute(
        'SELECT correo, telefono, usuario FROM empleado WHERE correo = ? OR telefono = ? OR usuario = ?',
        [correo, telefono, usuario]
      );
      
      if (existingEmployee.length > 0) {
        if (existingEmployee[0].correo === correo) {
          response.details.push('El correo ya está en uso.');
        }
        if (existingEmployee[0].telefono === telefono) {
          response.details.push('El teléfono ya está en uso.');
        }
        if (existingEmployee[0].usuario === usuario) {
          response.details.push('El usuario ya está en uso.');
        }
        
        response.message = 'Validación fallida';
        return response;
      }
      
      // Si no hay duplicados, proceder con la inserción
      const [result] = await this.connection.execute(
        'INSERT INTO empleado (nombre, apellido, telefono, correo, puesto, sucursal_id, usuario, clave) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [nombre, apellido, telefono, correo, puesto, sucursal_id, usuario, clave]
      );
      
      response.success = true;
      response.message = 'Empleado creado exitosamente';
      response.empleadoId = result.insertId;
      
      return response;
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
    
    const response = {
      success: false,
      message: '',
      details: [],
    };
    
    try {
      // Verificar duplicados excluyendo el empleado actual
      const [existingEmployee] = await this.connection.execute(
        'SELECT correo, telefono, usuario FROM empleado WHERE (correo = ? OR telefono = ? OR usuario = ?) AND id != ?',
        [correo, telefono, usuario, id]
      );
      
      if (existingEmployee.length > 0) {
        if (existingEmployee[0].correo === correo) {
          response.details.push('El correo ya está en uso.');
        }
        if (existingEmployee[0].telefono === telefono) {
          response.details.push('El teléfono ya está en uso.');
        }
        if (existingEmployee[0].usuario === usuario) {
          response.details.push('El usuario ya está en uso.');
        }
        
        response.message = 'Validación fallida';
        return response;
      }
      
      // Si no hay duplicados, proceder con la actualización
      const [result] = await this.connection.execute(
        'UPDATE empleado SET nombre = ?, apellido = ?, telefono = ?, correo = ?, puesto = ?, sucursal_id = ?, usuario = ?, clave = ? WHERE id = ?',
        [nombre, apellido, telefono, correo, puesto, sucursal_id, usuario, clave, id]
      );
      
      response.success = true;
      response.message = 'Empleado actualizado exitosamente';
      response.affectedRows = result.affectedRows;
      
      return response;
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
