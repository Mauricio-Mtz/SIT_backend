const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbconfig");

class CitaModel {
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

  async obtenerTodas(sucursal) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        `
            SELECT 
                cita.id, 
                cita.nombre, 
                cita.apellido, 
                cita.marca, 
                cita.modelo, 
                cita.tipo, 
                cita.año, 
                cita.correo, 
                cita.numero, 
                cita.fecha, 
                cita.hora,
                sucursal.nombre AS sucursal,
                servicio.nombre AS servicio,
                cita.status
            FROM cita
            INNER JOIN sucursal ON cita.sucursal_id = sucursal.id
            LEFT JOIN servicio ON cita.servicio_id = servicio.id
            WHERE sucursal.id = ?
        `,
        [sucursal]
      );
      return results;
    } catch {
      throw error;
    } finally {
      await this.disconnect();
    }
  }  
  
  async aprobarCita(id) {
    await this.connect();
    try {
      const [result] = await this.connection.execute(
        'UPDATE cita SET status = 1 WHERE id = ?',
        [id]
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async cancelarCita(id) {
    await this.connect();
    try {
      const [result] = await this.connection.execute(
        'UPDATE cita SET status = 0 WHERE id = ?',
        [id]
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async obtenerClientePorFolio(folio) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        "SELECT * FROM cliente WHERE folio = ?",
        [folio]
      );
      return results[0];
    } catch {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async obtenerFechaHoraCitas() {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        "SELECT id, fecha, hora FROM cita"
      );
      return results;
    } catch {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async crearCita(cita) {
    await this.connect();
    const {nombre, apellido, marca, tipo, año, modelo, correo, numero, fecha, hora, cliente_id = null, sucursal_id, servicio_id,} = cita;
    try {
      const [result] = await this.connection.execute(
        "INSERT INTO cita (nombre, apellido, marca, tipo, año, modelo, correo, numero, fecha, hora, cliente_id, sucursal_id, servicio_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [nombre, apellido, marca, tipo, año, modelo, correo, numero, fecha, hora, cliente_id, sucursal_id, servicio_id,]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}
module.exports = CitaModel;
