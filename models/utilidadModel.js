const mysql = require('mysql2/promise');
const dbConfig = require('../config/dbconfig');

class UtilidadModel {
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

  async obtenerTodas() {
    await this.connect();
    try {
      const [results] = await this.connection.execute(`
        SELECT 
          u.id, 
          u.fecha, 
          c.id AS cliente_id, 
          c.nombre AS cliente_nombre, 
          c.apellido AS cliente_apellido,
          e.id AS empleado_id, 
          e.nombre AS empleado_nombre, 
          e.apellido AS empleado_apellido,
          s.id AS sucursal_id, 
          s.nombre AS sucursal_nombre,
          u.total, 
          u.ganancia
        FROM utilidad u
        LEFT JOIN cliente c ON u.cliente_id = c.id
        LEFT JOIN empleado e ON u.empleado_id = e.id
        LEFT JOIN sucursal s ON u.sucursal_id = s.id
      `);

      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async obtenerVentasPorPeriodo(sucursal_id, fecha_inicio, fecha_fin) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        `
          SELECT 
              utilidad.id,
              utilidad.total,
              utilidad.ganancia,
              utilidad.fecha,
              cliente.nombre AS cliente_nombre,
              cliente.apellido AS cliente_apellido,
              empleado.nombre AS empleado_nombre,
              empleado.apellido AS empleado_apellido,
              sucursal.nombre AS sucursal_nombre
          FROM utilidad
          INNER JOIN cliente ON utilidad.cliente_id = cliente.id
          INNER JOIN empleado ON utilidad.empleado_id = empleado.id
          INNER JOIN sucursal ON utilidad.sucursal_id = sucursal.id
          WHERE utilidad.sucursal_id = ? AND utilidad.fecha BETWEEN ? AND ?
        `,
        [sucursal_id, fecha_inicio, fecha_fin]
      );
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }  
}

module.exports = UtilidadModel;
