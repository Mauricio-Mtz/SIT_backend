const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbconfig");

class RefaccionModel {
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

  async registrar(refaccion) {
    await this.connect();
    const { numero_parte, descripcion, cantidad, precio, ubicacion, sucursal_id, proveedor_id } = refaccion;
    try {
      const [result] = await this.connection.execute(
        "INSERT INTO refaccion (numero_parte, descripcion, cantidad, precio, ubicacion, sucursal_id, proveedor_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [numero_parte, descripcion, cantidad, precio, ubicacion, sucursal_id, proveedor_id]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }  

  async obtenerUna(id) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        "SELECT * FROM refaccion WHERE id = ?",
        [id]
      );
      return results[0];
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async actualizar(id, refaccion) {
    await this.connect();
    const { descripcion, cantidad, precio, ubicacion, sucursal_id } = refaccion;
    try {
      const [result] = await this.connection.execute(
        "UPDATE refaccion SET descripcion = ?, cantidad = ?, precio = ?, ubicacion = ?, sucursal_id = ? WHERE id = ?",
        [descripcion, cantidad, precio, ubicacion, sucursal_id, id]
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
      const [result] = await this.connection.execute(
        "UPDATE refaccion SET status = 0 WHERE id = ?",
        [id]
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async obtenerTodas(sucursal) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(`
        SELECT 
          refaccion.id, 
          refaccion.numero_parte, 
          refaccion.descripcion, 
          refaccion.precio, 
          refaccion.cantidad, 
          refaccion.ubicacion, 
          sucursal.id as sucursal_id,
          sucursal.nombre as sucursal,
          proveedor.id as proveedor_id,
          proveedor.nombre as proveedor
          FROM refaccion
        INNER JOIN sucursal on refaccion.sucursal_id = sucursal.id
        INNER JOIN proveedor on refaccion.proveedor_id = proveedor.id
        WHERE sucursal.id = ? AND refaccion.status = 1
      `,[sucursal]);
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = RefaccionModel;
