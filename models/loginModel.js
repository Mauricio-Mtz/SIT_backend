const mysql = require('mysql2/promise');
const dbConfig = require('../config/dbconfig');

class LoginModel {
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

  async buscarEmpleado(usuario, clave) {
    await this.connect();

    try {
      const [results] = await this.connection.execute(
        "SELECT * FROM empleado WHERE usuario = ? AND clave = ?",
        [usuario, clave]
      );
      return results[0];
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

module.exports = LoginModel;
