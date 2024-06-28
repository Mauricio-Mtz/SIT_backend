const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbconfig");

class SucursalModel {
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

//   async registrar(refaccion) {
//     await this.connect();
//     const { nombre, descripcion, precio, sucursal_id } = refaccion;
//     try {
//       const [result] = await this.connection.execute(
//         "INSERT INTO refaccion (nombre, descripcion, precio, sucursal_id) VALUES (?, ?, ?, ?)",
//         [nombre, descripcion, precio, sucursal_id]
//       );
//       return result.insertId;
//     } catch (error) {
//       throw error;
//     } finally {
//       await this.disconnect();
//     }
//   }  

//   async obtenerUna(id) {
//     await this.connect();
//     try {
//       const [results] = await this.connection.execute(
//         "SELECT * FROM refaccion WHERE id = ?",
//         [id]
//       );
//       return results[0];
//     } catch (error) {
//       throw error;
//     } finally {
//       await this.disconnect();
//     }
//   }

//   async actualizar(id, refaccion) {
//     await this.connect();
//     const { nombre, descripcion, precio, sucursal_id } = refaccion;
//     try {
//       const [result] = await this.connection.execute(
//         "UPDATE refaccion SET nombre = ?, descripcion = ?, precio = ?, sucursal_id = ? WHERE id = ?",
//         [nombre, descripcion, precio, sucursal_id, id]
//       );
//       return result.affectedRows;
//     } catch (error) {
//       throw error;
//     } finally {
//       await this.disconnect();
//     }
//   }

//   async eliminar(id) {
//     await this.connect();
//     try {
//       const [result] = await this.connection.execute(
//         "DELETE FROM refaccion WHERE id = ?",
//         [id]
//       );
//       return result.affectedRows;
//     } catch (error) {
//       throw error;
//     } finally {
//       await this.disconnect();
//     }
//   }

  async obtenerTodas() {
    await this.connect();
    try {
      const [results] = await this.connection.execute('SELECT * FROM sucursal');
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = SucursalModel;
