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

  async obtenerVentasPorPeriodo(fecha_inicio, fecha_fin) {
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
          WHERE utilidad.fecha BETWEEN ? AND ?
        `,
        [fecha_inicio, fecha_fin]
      );
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }  
  
  async obtenerDetalleUtilidad(utilidadId) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        `
          SELECT 
              utilidad.id,
              orden_trabajo.id AS ordenId,
              orden_trabajo.folio AS ordenFolio,
              utilidad.total,
              utilidad.ganancia,
              utilidad.fecha,
              cliente.folio AS cliente_folio,
              cliente.nombre AS cliente_nombre,
              cliente.apellido AS cliente_apellido,
              cliente.correo AS cliente_correo,
              cliente.telefono AS cliente_telefono,
              empleado.nombre AS empleado_nombre,
              empleado.apellido AS empleado_apellido,
              empleado.telefono AS empleado_telefono,
              empleado.correo AS empleado_correo,
              sucursal.nombre AS sucursal_nombre,
              sucursal.telefono AS sucursal_telefono,
              sucursal.direccion AS sucursal_direccion,
              orden_trabajo.descripcion AS orden_descripcion
          FROM utilidad
          INNER JOIN cliente ON utilidad.cliente_id = cliente.id
          INNER JOIN empleado ON utilidad.empleado_id = empleado.id
          INNER JOIN sucursal ON utilidad.sucursal_id = sucursal.id
          INNER JOIN orden_trabajo ON utilidad.orden_trabajo_id = orden_trabajo.id
          WHERE utilidad.id = ?
        `,
        [utilidadId]
      );
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async obtenerPaquetesOrden(ordenTrabajoId) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        `
          SELECT 
            nombre, 
            precio 
          FROM paquete_orden
          WHERE orden_id = ?
        `,
        [ordenTrabajoId]
      );
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async obtenerRefaccionesOrden(ordenTrabajoId) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        `
          SELECT 
            *
          FROM refaccion_orden
          WHERE orden_id = ?
        `,
        [ordenTrabajoId]
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
