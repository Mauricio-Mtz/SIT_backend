const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbconfig");

class ServicioModel {
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

  async obtenerTodos() {
    await this.connect();
    try {
      const [results] = await this.connection.execute('SELECT * FROM servicio');
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
  
  async serviciosOrden(ordenId) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(`
        SELECT 
          so.*, 
          s.nombre, 
          s.descripcion, 
          s.precio
        FROM servicio_orden so
        INNER JOIN servicio s ON so.servicio_id = s.id
        WHERE so.orden_id = ?
      `, [ordenId]);
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }  
}

module.exports = ServicioModel;
