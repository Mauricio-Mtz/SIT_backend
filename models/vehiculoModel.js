const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbconfig");

class VehiculoModel {
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

  async vehiculosCliente(cliente_id) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(`
        SELECT *
        FROM vehiculo
        WHERE cliente_id = ?
      `,[cliente_id]
      );

      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
  
}

module.exports = VehiculoModel;
