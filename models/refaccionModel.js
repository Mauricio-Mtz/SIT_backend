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
    const { numero_parte, descripcion, cantidad, precio, ganancia, ubicacion, sucursal_id, proveedor_id } = refaccion;
    try {
      const [result] = await this.connection.execute(
        "INSERT INTO refaccion (numero_parte, descripcion, cantidad, precio, ganancia, ubicacion, sucursal_id, proveedor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [numero_parte, descripcion, cantidad, precio, ganancia, ubicacion, sucursal_id, proveedor_id]
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
    const { descripcion, cantidad, precio, ganancia, ubicacion, sucursal_id } = refaccion;
    try {
      const [result] = await this.connection.execute(
        "UPDATE refaccion SET descripcion = ?, cantidad = ?, precio = ?, ganancia = ?, ubicacion = ?, sucursal_id = ? WHERE id = ?",
        [descripcion, cantidad, precio, ganancia, ubicacion, sucursal_id, id]
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
          refaccion.ganancia, 
          refaccion.cantidad, 
          refaccion.ubicacion, 
          sucursal.id as sucursal_id,
          sucursal.nombre as sucursal,
          proveedor.id as proveedor_id,
          proveedor.nombre as proveedor
          FROM refaccion
        INNER JOIN sucursal on refaccion.sucursal_id = sucursal.id
        INNER JOIN proveedor on refaccion.proveedor_id = proveedor.id
        WHERE sucursal.id = ?
      `,[sucursal]);
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async obtenerTodasS() {
    await this.connect();
    try {
      const [results] = await this.connection.execute(`
        SELECT 
          refaccion.id, 
          refaccion.numero_parte, 
          refaccion.descripcion, 
          refaccion.cantidad 
        FROM refaccion
      `,[]);
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async validarStock(refacciones) {
    await this.connect();
  
    const stockErrors = [];
  
    try {
      for (const refaccion of refacciones) {
        const [result] = await this.connection.execute(
          "SELECT cantidad FROM refaccion WHERE id = ?",
          [refaccion.id]
        );
  
        if (result.length > 0) {
          const stockDisponible = result[0].cantidad;
          if (stockDisponible < refaccion.cantidad) {
            stockErrors.push(refaccion.id);
          }
        } else {
          // Si la refacción no se encuentra en la base de datos, también la añadimos a los errores de stock
          stockErrors.push(refaccion.id);
        }
      }
  
      return stockErrors;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
  
}

module.exports = RefaccionModel;
