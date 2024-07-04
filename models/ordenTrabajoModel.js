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
      const [results] = await this.connection.execute(`
        SELECT *
        FROM orden_trabajo
        WHERE empleado_id = ?
      `,[empleado_id]
      );

      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
  
  async obtenerTodas() {
    await this.connect();
    try {
      const [results] = await this.connection.execute(`
        SELECT *
        FROM orden_trabajo
      `);
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async siguientePaso(ordenId,fecha,proceso,estado,serviciosSeleccionados,refaccionesOrden) {
    await this.connect();
    const connection = this.connection;

    try {
      await connection.beginTransaction();

      if (estado === "Completado") {
        // Si el estado es "Completado", actualiza ambas fechas
        await connection.execute(
          `
          UPDATE orden_trabajo
          SET estado = ?, fecha_${proceso} = ?, fecha_fin = ?
          WHERE id = ?
          `,
          [estado, fecha, new Date(), ordenId]
        );
      } else {
        // Si no es "Completado", actualiza solo la fecha correspondiente
        await connection.execute(
          `
          UPDATE orden_trabajo
          SET estado = ?, fecha_${proceso} = ?
          WHERE id = ?
          `,
          [estado, fecha, ordenId]
        );
      }

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

  async anteriorPaso(ordenId, estado) {
    await this.connect();
    const connection = this.connection;
  
    try {
      await connection.beginTransaction();
  
      await connection.execute(
        `
        UPDATE orden_trabajo
        SET estado = ?, fecha_reparacion = null
        WHERE id = ?
        `,
        [estado, ordenId]
      );
  
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

  async verificarContrasena(clave) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        `
        SELECT COUNT(*) AS count
        FROM empleado
        WHERE clave = ? AND puesto = 'administrador'
        `,
        [clave]
      );

      return results[0].count > 0;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async serviciosPorOrden(folio) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        `
        SELECT *
        FROM servicio_orden
        WHERE orden_id = ?
      `,
        [folio]
      );

      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async createOrdenTrabajo(ordenTrabajo) {
    await this.connect();
    const connection = this.connection;

    try {
      await connection.beginTransaction();

      // Obtener el último folio de la tabla orden_trabajo
      const [folios] = await connection.execute(
        "SELECT MAX(folio) AS ultimoFolio FROM orden_trabajo"
      );

      const ultimoFolio = folios[0].ultimoFolio;

      // Generar el nuevo folio
      let nuevoFolio;
      if (ultimoFolio) {
        const ultimoNumero = parseInt(ultimoFolio.slice(2)); // Extraer el número del folio
        const nuevoNumero = ultimoNumero + 1;
        nuevoFolio = `OT${nuevoNumero.toString().padStart(3, '0')}`; // Formatear el nuevo folio
      } else {
        nuevoFolio = 'OT000'; // Primer folio
      }

      const [result] = await connection.execute(
        `
        INSERT INTO orden_trabajo (folio, nombre, apellido, correo, telefono, marca, modelo, tipo, año, fecha_inicio, estado, cliente_id, empleado_id, sucursal_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'Diagnostico pendiente', ?, ?, ?)
        `,
        [
          nuevoFolio,
          ordenTrabajo.nombre,
          ordenTrabajo.apellido,
          ordenTrabajo.correo,
          ordenTrabajo.telefono,
          ordenTrabajo.marca,
          ordenTrabajo.modelo,
          ordenTrabajo.tipo,
          ordenTrabajo.año,
          ordenTrabajo.cliente_id,
          ordenTrabajo.empleado_id,
          ordenTrabajo.sucursal_id,
        ]
      );

      const ordenId = result.insertId;
      
      // Insertar los registros en la tabla servicio_orden
      for (const servicioId of ordenTrabajo.servicios) {
        await connection.execute(
          `
          INSERT INTO servicio_orden (orden_id, servicio_id)
          VALUES (?, ?)
          `,
          [ordenId, servicioId]
        );
      }

      await connection.commit();
      return ordenId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await this.disconnect();
    }
  }
  
}

module.exports = OrdenTrabajoModel;
