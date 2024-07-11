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
        SELECT 
            ot.id,
            ot.folio AS folio_orden,
            ot.fecha_inicio,
            ot.fecha_fin,
            ot.estado,
            c.id AS cliente_id,
            c.folio AS folio_cliente,
            c.nombre AS nombre_cliente,
            c.apellido AS apellido_cliente,
            v.id AS vehiculo_id,
            v.marca AS marca_vehiculo,
            v.modelo AS modelo_vehiculo,
            v.tipo AS tipo_vehiculo,
            v.año AS año_vehiculo,
            e.id AS empleado_id,
            e.nombre AS nombre_empleado,
            e.apellido AS apellido_empleado,
            s.id AS sucursal_id,
            s.nombre AS nombre_sucursal,
            s.direccion AS direccion_sucursal
        FROM orden_trabajo ot
        JOIN cliente c ON ot.cliente_id = c.id
        JOIN vehiculo v ON ot.vehiculo_id = v.id
        JOIN empleado e ON ot.empleado_id = e.id
        JOIN sucursal s ON ot.sucursal_id = s.id
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
        SELECT 
            ot.id,
            ot.folio AS folio_orden,
            ot.fecha_inicio,
            ot.fecha_fin,
            ot.estado,
            c.id AS cliente_id,
            c.folio AS folio_cliente,
            c.nombre AS nombre_cliente,
            c.apellido AS apellido_cliente,
            v.id AS vehiculo_id,
            v.marca AS marca_vehiculo,
            v.modelo AS modelo_vehiculo,
            v.tipo AS tipo_vehiculo,
            v.año AS año_vehiculo,
            e.id AS empleado_id,
            e.nombre AS nombre_empleado,
            e.apellido AS apellido_empleado,
            s.id AS sucursal_id,
            s.nombre AS nombre_sucursal,
            s.direccion AS direccion_sucursal
        FROM orden_trabajo ot
        JOIN cliente c ON ot.cliente_id = c.id
        JOIN vehiculo v ON ot.vehiculo_id = v.id
        JOIN empleado e ON ot.empleado_id = e.id
        JOIN sucursal s ON ot.sucursal_id = s.id
      `);
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async finalizaDiagnostico(ordenId, estado) {
    await this.connect();
    const connection = this.connection;

    try {
      const [result] = await this.connection.execute(`
        UPDATE orden_trabajo
        SET estado = ?
        WHERE id = ?
      `,[estado, ordenId]);
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
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

  async serviciosPorOrden(id) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(
        `
        SELECT *
        FROM servicio_orden
        WHERE orden_id = ?
      `,
        [id]
      );

      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async crearCliente({ nombre, apellido, numero, correo }) {
    await this.connect();
    try {
      // Obtener el folio máximo actual y sumarle 1 para el nuevo folio
      const [rows] = await this.connection.execute(
        'SELECT IFNULL(MAX(folio), 9999999) + 1 AS nuevo_folio FROM cliente'
      );
      const nuevoFolio = rows[0].nuevo_folio;
  
      // Insertar el nuevo cliente en la base de datos
      const [result] = await this.connection.execute(
        'INSERT INTO cliente (folio, nombre, apellido, telefono, correo, contrasena) VALUES (?, ?, ?, ?, ?, ?)',
        [nuevoFolio, nombre, apellido, numero, correo, nuevoFolio]
      );
  
      return result.insertId;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async asignarVehiculo({marca, modelo, tipo, año, cliente_id}) {
    await this.connect();
    try {  
      // Insertar el nuevo vehiculo en la base de datos
      const [result] = await this.connection.execute(
        'INSERT INTO vehiculo (marca, modelo, tipo, año, cliente_id) VALUES (?, ?, ?, ?, ?)',
        [marca, modelo, tipo, año, cliente_id]
      );
  
      return result.insertId;
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
      // Generar el nuevo folio
      let nuevoFolio;
      if (folios[0].ultimoFolio) {
        const ultimoNumero = parseInt(folios[0].ultimoFolio.slice(2)); // Extraer el número del folio
        const nuevoNumero = ultimoNumero + 1;
        nuevoFolio = `OT${nuevoNumero.toString().padStart(3, '0')}`; // Formatear el nuevo folio
      } else {
        nuevoFolio = 'OT000'; // Primer folio
      }

      if (ordenTrabajo.cliente === '') {
        const clienteId = await this.crearCliente({
          nombre: ordenTrabajo.nombre,
          apellido: ordenTrabajo.apellido,
          numero: ordenTrabajo.telefono,
          correo: ordenTrabajo.correo,
        });
        ordenTrabajo.cliente = clienteId;
      }

      if (ordenTrabajo.vehiculo === '') {
        const vehiculoId = await this.asignarVehiculo({
          marca: ordenTrabajo.marca,
          modelo: ordenTrabajo.modelo,
          tipo: ordenTrabajo.tipo,
          año: ordenTrabajo.año,
          cliente_id: ordenTrabajo.cliente,
        });
        ordenTrabajo.vehiculo = vehiculoId;
      }

      const [result] = await connection.execute(
        `
        INSERT INTO orden_trabajo (folio, fecha_inicio, estado, cliente_id, vehiculo_id, empleado_id, sucursal_id)
        VALUES (?, CURDATE(), 'Diagnostico', ?, ?, ?, ?)
        `,
        [
          nuevoFolio,
          ordenTrabajo.cliente,
          ordenTrabajo.vehiculo,
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
