const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbconfig");

class jsonModel {
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
}
module.exports = jsonModel;
