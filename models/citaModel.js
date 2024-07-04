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
                cita.status,
                cita.cliente_id,
                cita.sucursal_id,
                cita.servicio_id
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
    const { nombre, apellido, correo, numero, descripcion, marca, tipo, año, modelo, fecha, hora, cliente_id = null, sucursal_id, servicios } = cita;
    try {
        // Insertar la cita en la tabla cita
        const [result] = await this.connection.execute(
            "INSERT INTO cita (nombre, apellido, correo, numero, descripcion, marca, tipo, año, modelo, fecha, hora, cliente_id, sucursal_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [nombre, apellido, correo, numero, descripcion, marca, tipo, año, modelo, fecha, hora, cliente_id, sucursal_id]
        );

        // Obtener el ID de la cita recién insertada
        const citaId = result.insertId;

        // Insertar las relaciones en la tabla servicio_cita si hay servicios
        if (servicios && servicios.length > 0) {
            for (const servicioId of servicios) {
                await this.connection.execute(
                    "INSERT INTO servicio_cita (cita_id, servicio_id) VALUES (?, ?)",
                    [citaId, servicioId]
                );
            }
        }

        return citaId;
    } catch (error) {
        throw error;
    } finally {
        await this.disconnect();
    }
  }


  async aprobarOrdenTrabajo(citaId) {
    await this.connect();
    try {
        // Actualizar el estado de la cita a aprobado (status = 3)
        const [result] = await this.connection.execute(
            "UPDATE cita SET status = 3 WHERE id = ?",
            [citaId]
        );
        return result.affectedRows > 0;
    } catch (error) {
        throw error;
    } finally {
        await this.disconnect();
    }
  }

  async generarNuevoFolio() {
    await this.connect();
    try {
        // Obtener el último folio de la tabla orden_trabajo
        const [result] = await this.connection.execute(
            "SELECT MAX(folio) AS ultimoFolio FROM orden_trabajo"
        );

        const ultimoFolio = result[0].ultimoFolio;

        // Generar el nuevo folio
        let nuevoFolio;
        if (ultimoFolio) {
            const ultimoNumero = parseInt(ultimoFolio.slice(2)); // Extraer el número del folio
            const nuevoNumero = ultimoNumero + 1;
            nuevoFolio = `OT${nuevoNumero.toString().padStart(3, '0')}`; // Formatear el nuevo folio
        } else {
            nuevoFolio = 'OT000'; // Primer folio
        }

        return nuevoFolio;
    } catch (error) {
        throw error;
    } finally {
        await this.disconnect();
    }
  }

  async crearOrdenTrabajo({ citaId, folio, marca, modelo, año, tipo, cliente_id, empleado_id, sucursal_id }) {
    await this.connect();
    try {
      let nombre = null;
      let apellido = null;
      let telefono = null;
      let correo = null;
      let direccion = null;
      let codigo_postal = null;
      let rfc = null;
  
      // Si cliente_id tiene valor, obtener los datos del cliente
      if (cliente_id) {
        const [cliente] = await this.connection.execute(
          "SELECT nombre, apellido, direccion, codigo_postal, correo, telefono, rfc FROM cliente WHERE id = ?",
          [cliente_id]
        );
  
        if (cliente.length > 0) {
          nombre = cliente[0].nombre;
          apellido = cliente[0].apellido;
          correo = cliente[0].correo;
          telefono = cliente[0].telefono;
          direccion = cliente[0].direccion;
          codigo_postal = cliente[0].codigo_postal;
          rfc = cliente[0].rfc;
        } else {
          throw new Error('Cliente no encontrado');
        }
      } else {
        const [cliente] = await this.connection.execute(
          "SELECT nombre, apellido, correo, numero FROM cita WHERE id = ?",
          [citaId]
        );
  
        if (cliente.length > 0) {
          nombre = cliente[0].nombre;
          apellido = cliente[0].apellido;
          correo = cliente[0].correo;
          telefono = cliente[0].numero;
        } else {
          throw new Error('Cliente no encontrado');
        }
      }
  
      // Insertar la orden de trabajo en la tabla orden_trabajo
      const [result] = await this.connection.execute(
        "INSERT INTO orden_trabajo (folio, nombre, apellido, correo, direccion, codigo_postal, telefono, rfc, marca, modelo, tipo, año, fecha_inicio, estado, cliente_id, empleado_id, sucursal_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'Diagnostico pendiente', ?, ?, ?)",
        [folio, nombre, apellido, correo, direccion, codigo_postal, telefono, rfc, marca, modelo, tipo, año, cliente_id, empleado_id, sucursal_id]
      );
  
      // Obtener el ID de la orden de trabajo recién insertada
      const ordenTrabajoId = result.insertId;
  
      return ordenTrabajoId;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }  

  async asignarServiciosAOrdenTrabajo(ordenTrabajoId, citaId) {
    await this.connect();
    try {
        // Obtener los servicios asociados a la cita
        const [result] = await this.connection.execute(
            "SELECT servicio_id FROM servicio_cita WHERE cita_id = ?",
            [citaId]
        );

        const servicios = result.map(row => row.servicio_id);

        // Insertar los registros en la tabla servicio_orden
        for (const servicioId of servicios) {
            await this.connection.execute(
                "INSERT INTO servicio_orden (orden_id, servicio_id) VALUES (?, ?)",
                [ordenTrabajoId, servicioId]
            );
        }
    } catch (error) {
        throw error;
    } finally {
        await this.disconnect();
    }
  }

}
module.exports = CitaModel;
