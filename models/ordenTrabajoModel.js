const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbconfig");

class OrdenTrabajoModel {
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

  async obtenerPorEmpleado(empleado_id) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        `
        SELECT
          ot.id,
          ot.folio,
          ot.marca,
          ot.modelo,
          ot.tipo,
          ot.año,
          ot.fecha_inicio,
          ot.fecha_diagnostico,
          ot.fecha_cotizacion,
          ot.fecha_seleccion_servicio,
          ot.fecha_seleccion_refacciones,
          ot.fecha_reparacion,
          ot.fecha_confirmacion,
          ot.fecha_fin,
          ot.estado,
          ot.cliente_id,
          ot.empleado_id,
          ot.sucursal_id,
          c.nombre AS nombre_cliente,
          c.apellido AS apellido_cliente,
          c.telefono AS telefono_cliente,
          c.correo AS correo_cliente
        FROM orden_trabajo ot
        INNER JOIN cliente c ON ot.cliente_id = c.id
        WHERE ot.empleado_id = ?
      `,
        [empleado_id]
      );

      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async siguientePaso(ordenId, fecha, proceso, estado, serviciosSeleccionados, refaccionesOrden) {
    await this.connect();
    const connection = this.connection;
    
    try {
      await connection.beginTransaction();
  
      await connection.execute(
        `
        UPDATE orden_trabajo
        SET estado = ?, fecha_${proceso} = ?
        WHERE id = ?
        `,
        [estado, fecha, ordenId]
      );
  
      if (serviciosSeleccionados && serviciosSeleccionados.length > 0) {
        for (const servicioId of serviciosSeleccionados) {
          await connection.execute(
            `
            INSERT INTO servicio_orden (orden_id, servicio_id)
            VALUES (?, ?)
            `,
            [ordenId, servicioId]
          );
        }
      }
  
      if (refaccionesOrden && refaccionesOrden.length > 0) {
        for (const { id: refaccionId, cantidad } of refaccionesOrden) {
          await connection.execute(
            `
            INSERT INTO refaccion_orden (orden_id, refaccion_id, cantidad)
            VALUES (?, ?, ?)
            `,
            [ordenId, refaccionId, cantidad]
          );
        }
      }
  
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await this.disconnect();
    }
  }

async obtenerDetallesCotizacion(ordenId) {
  await this.connect();
  try {
    const [servicios] = await this.connection.execute(
      `
      SELECT s.id, s.nombre, s.precio
      FROM servicio s
      INNER JOIN servicio_orden so ON s.id = so.servicio_id
      WHERE so.orden_id = ?
      `,
      [ordenId]
    );

    const [refacciones] = await this.connection.execute(
      `
      SELECT r.id, r.descripcion, r.precio, ro.cantidad
      FROM refaccion r
      INNER JOIN refaccion_orden ro ON r.id = ro.refaccion_id
      WHERE ro.orden_id = ?
      `,
      [ordenId]
    );

    return { servicios, refacciones };
  } catch (error) {
    throw error; // Lanza la excepción para manejarla en otro lugar
  } finally {
    await this.disconnect();
  }
}

  
  
}

module.exports = OrdenTrabajoModel;
