const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbconfig");
const crypto = require('crypto');

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
                cita.descripcion,
                cita.cliente_id,
                cita.vehiculo_id,
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
    const { nombre, apellido, correo, numero, descripcion, marca, tipo, año, modelo, fecha, hora, sucursal_id, servicios } = cita;
    const cliente_id = cita.cliente_id === 0 ? null : cita.cliente_id;
    const vehiculo_id = cita.vehiculo_id === 0 ? null : cita.vehiculo_id;
  
    try {
      // Validar si se necesita crear un nuevo cliente
      if (cliente_id === null) {
        // Verificar si el correo o el teléfono ya existen en la base de datos
        const [existingClient] = await this.connection.execute(
          `
          SELECT id
          FROM cliente
          WHERE correo = ? OR telefono = ?
          `,
          [correo, numero]
        );
  
        if (existingClient.length > 0) {
          throw new Error('El correo electrónico o el teléfono ya están en uso.');
        }
      }
  
      // Insertar la cita en la tabla cita
      const [result] = await this.connection.execute(
        "INSERT INTO cita (nombre, apellido, correo, numero, descripcion, marca, tipo, año, modelo, fecha, hora, cliente_id, vehiculo_id, sucursal_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [nombre, apellido, correo, numero, descripcion, marca, tipo, año, modelo, fecha, hora, cliente_id, vehiculo_id, sucursal_id]
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
  
  async crearCliente({ nombre, apellido, numero, correo }) {
    await this.connect();
    try {
      // Obtener el folio máximo actual y sumarle 1 para el nuevo folio
      const [rows] = await this.connection.execute(
        'SELECT IFNULL(MAX(folio), 9999999) + 1 AS nuevo_folio FROM cliente'
      );
      const nuevoFolio = rows[0].nuevo_folio;
  
      // Hash del folio usando SHA-256
      const hash = crypto.createHash('sha256');
      hash.update(nuevoFolio.toString());
      const hashedPassword = hash.digest('hex');
  
      // Insertar el nuevo cliente en la base de datos
      const [result] = await this.connection.execute(
        'INSERT INTO cliente (folio, nombre, apellido, telefono, correo, contrasena) VALUES (?, ?, ?, ?, ?, ?)',
        [nuevoFolio, nombre, apellido, numero, correo, hashedPassword]
      );
  
      return result.insertId;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async crearVehiculo({marca, modelo, tipo, año, cliente}) {
    await this.connect();
    try {  
      // Insertar el nuevo vehiculo en la base de datos
      const [result] = await this.connection.execute(
        'INSERT INTO vehiculo (marca, modelo, tipo, año, cliente_id) VALUES (?, ?, ?, ?, ?)',
        [marca, modelo, tipo, año, cliente]
      );
  
      return result.insertId;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async crearOrdenTrabajo({ folio, descripcion, cliente_id, vehiculo_id, empleado_id, sucursal_id }) {
    await this.connect();
    try {
  
      // Insertar la orden de trabajo en la tabla orden_trabajo
      const [result] = await this.connection.execute(
        "INSERT INTO orden_trabajo (folio, fecha_inicio, estado, descripcion, cliente_id, vehiculo_id, empleado_id, sucursal_id) VALUES (?, CURDATE(), 'Diagnostico', ?, ?, ?, ?, ?)",
        [folio, descripcion, cliente_id, vehiculo_id, empleado_id, sucursal_id]
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
  
  async eliminar(id) {
    await this.connect();
    const response = {
      success: false,
      message: '',
      details: [],
    };
  
    try {
      // 1. Eliminar las relaciones en la tabla servicio_cita si existen
      await this.connection.execute(
        'DELETE FROM servicio_cita WHERE cita_id = ?',
        [id]
      );
  
      // 2. Eliminar la cita
      const [deleteCita] = await this.connection.execute(
        'DELETE FROM cita WHERE id = ?',
        [id]
      );
      
      if (deleteCita.affectedRows === 0) {
        response.message = 'Cita no encontrada.';
        return response;
      }
  
      response.details.push({
        action: 'Eliminar cita',
        affectedRows: deleteCita.affectedRows,
      });
  
      response.success = true;
      response.message = 'Cita eliminada exitosamente.';
      return response;
  
    } catch (error) {
      response.message = 'Error interno del servidor.';
      response.details.push({ error: error.message });
      return response;
    } finally {
      await this.disconnect();
    }
  }  
}
module.exports = CitaModel;
