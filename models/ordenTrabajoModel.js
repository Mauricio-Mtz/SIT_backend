const mysql = require("mysql2/promise");
const dbConfig = require("../config/dbconfig");
const crypto = require('crypto');

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
            ot.descripcion,
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
        ORDER BY ot.folio DESC
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
            ot.descripcion,
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
        ORDER BY ot.folio DESC
      `);
      return results;
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
      // 1. Verificar si la orden está asociada a una utilidad
      const [utilidadCheck] = await this.connection.execute(
        'SELECT COUNT(*) as count FROM utilidad WHERE orden_trabajo_id = ?',
        [id]
      );
  
      if (utilidadCheck[0].count > 0) {
        response.message = 'No se puede eliminar la orden de trabajo porque está asociada a una utilidad.';
        return response;
      }
  
      // 2. Eliminar las refacciones asociadas a la orden
      const [deleteRefacciones] = await this.connection.execute(
        'DELETE FROM refaccion_orden WHERE orden_id = ?',
        [id]
      );
      response.details.push({
        action: 'Eliminar refacciones',
        affectedRows: deleteRefacciones.affectedRows,
      });
  
      // 3. Eliminar los paquetes asociados a la orden
      const [deletePaquetes] = await this.connection.execute(
        'DELETE FROM paquete_orden WHERE orden_id = ?',
        [id]
      );
      response.details.push({
        action: 'Eliminar paquetes',
        affectedRows: deletePaquetes.affectedRows,
      });
  
      // 4. Eliminar la orden de trabajo
      const [deleteOrden] = await this.connection.execute(
        'DELETE FROM orden_trabajo WHERE id = ?',
        [id]
      );
      
      if (deleteOrden.affectedRows === 0) {
        response.message = 'Orden de trabajo no encontrada.';
        return response;
      }
  
      response.details.push({
        action: 'Eliminar orden de trabajo',
        affectedRows: deleteOrden.affectedRows,
      });
  
      response.success = true;
      response.message = 'Orden de trabajo eliminada exitosamente.';
      return response;
  
    } catch (error) {
      response.message = 'Error interno del servidor.';
      response.details.push({ error: error.message });
      return response;
    } finally {
      await this.disconnect();
    }
  }  

  async finalizaDiagnostico(ordenFolio) {
    await this.connect();
    const connection = this.connection;

    try {
      const [result] = await this.connection.execute(`
        UPDATE orden_trabajo
        SET estado = 'Cotizacion'
        WHERE folio = ?
      `,[ordenFolio]);
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
        SELECT *
        FROM paquete_orden
        WHERE orden_id = ?
        `,
        [ordenId]
      );

      const [refacciones] = await this.connection.execute(
        `
        SELECT *
        FROM refaccion_orden
        WHERE orden_id = ?
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
  
      // Validar si el correo o el teléfono ya existen
      const [existingClient] = await connection.execute(
        `
        SELECT id
        FROM cliente
        WHERE correo = ? OR telefono = ?
        `,
        [ordenTrabajo.correo, ordenTrabajo.telefono]
      );
  
      if (existingClient.length > 0) {
        throw new Error('El correo electrónico o el teléfono ya están en uso.');
      }
  
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
  
      // Crear cliente si es necesario
      if (ordenTrabajo.cliente === '') {
        const clienteId = await this.crearCliente({
          nombre: ordenTrabajo.nombre,
          apellido: ordenTrabajo.apellido,
          numero: ordenTrabajo.telefono,
          correo: ordenTrabajo.correo,
        });
        ordenTrabajo.cliente = clienteId;
      }
  
      // Crear vehículo si es necesario
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
  
      // Insertar la orden de trabajo en la base de datos
      const [result] = await connection.execute(
        `
        INSERT INTO orden_trabajo (folio, fecha_inicio, estado, descripcion, cliente_id, vehiculo_id, empleado_id, sucursal_id)
        VALUES (?, CURDATE(), 'Diagnostico', ?, ?, ?, ?, ?)
        `,
        [
          nuevoFolio,
          ordenTrabajo.descripcion,
          ordenTrabajo.cliente,
          ordenTrabajo.vehiculo,
          ordenTrabajo.empleado_id,
          ordenTrabajo.sucursal_id,
        ]
      );
  
      const ordenId = result.insertId;
  
      await connection.commit();
      return ordenId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await this.disconnect();
    }
  }  

  async agregarPaquete({nombre, precio, orden_id, status}) {
    await this.connect();
    try {  
      let res;
      let response = {};
      const [existingPackage] = await this.connection.execute(
        'SELECT id FROM paquete_orden WHERE nombre = ? AND orden_id = ?',
        [nombre, orden_id]
      );
  
      if (existingPackage.length > 0) {
        // El paquete ya existe, puedes manejarlo según tus necesidades (lanzar un error, actualizar, etc.)
        response = { 
          result: false, 
          message: 'El paquete ya existe para esta orden.', 
          response: null
        };
      } else {
        res = await this.connection.execute(
          'INSERT INTO paquete_orden (nombre, precio, orden_id, status) VALUES (?, ?, ?, ?)',
          [nombre, precio, orden_id, status]
        );
  
        if (res[0].insertId) {
          response = { 
            result: true, 
            message: 'El paquete se guardó correctamente.', 
            response: res[0].insertId 
          };
        } else {
          response = { 
            result: false, 
            message: 'El paquete no se guardó correctamente.', 
            response: null
          };
        }
      }
  
      return response;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }  

  async obtenerPaquetes(ordenId) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(`
        SELECT *
        FROM paquete_orden
        WHERE orden_id = ?
      `, [ordenId]);
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
  
  async eliminarPaquete({nombre, orden_id}) {
    await this.connect();
    try {  
      const [result] = await this.connection.execute(
        'DELETE FROM paquete_orden WHERE nombre = ? and orden_id = ?',
        [nombre, orden_id]
      );
      
      return result.insertId;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async verificarPaquete({ nombre, orden_id, refacciones }) {
    await this.connect();
    let message = "";
    let result = true;
    try {
      // 1. Obtener el paquete desde la base de datos
      const [paquete] = await this.connection.execute(
        'SELECT * FROM paquete_orden WHERE nombre = ? AND orden_id = ?',
        [nombre, orden_id]
      );
      
      if (paquete.length === 0) {
        throw new Error('Paquete no encontrado');
      }
  
      // 2. Verificar la cantidad de stock de las refacciones del paquete
      for (const refaccion of refacciones) {
        // Consulta para obtener la cantidad actual de la refacción en el stock
        const [stock] = await this.connection.execute(
          'SELECT cantidad FROM refaccion WHERE id = ?',
          [refaccion.id]
        );
        
        if (stock.length === 0) {
          throw new Error(`Refacción con ID ${refaccion.id} no encontrada en stock`);
        }
  
        // Verificar si la cantidad solicitada es mayor o igual a la disponible
        if (refaccion.cantidad >= stock[0].cantidad) {
          console.log("cantidad insuficiente")
          result = false;
          message = `Cantidad insuficiente para la refacción con ID ${refaccion.id}`;
          break;
        }
      }
  
      // 3. Si todo está bien, actualizar el estado del paquete a 1
      if (result) {
        await this.connection.execute(
          'UPDATE paquete_orden SET status = 1 WHERE nombre = ? AND orden_id = ?',
          [nombre, orden_id]
        );
        message = "Paquete verificado correctamente";
      }

      return {result, message};
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }  

  async finalizarReparacion( id ) {
    await this.connect();
    try {
      const [result] = await this.connection.execute(
        'UPDATE orden_trabajo SET estado = "Confirmacion" WHERE id = ?',
        [id]
      );
  
      return result.insertId;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }
  
  async obtenerRefaccionesAsignadas(ordenId) {
    await this.connect();
    try {
      const [results] = await this.connection.execute(`
        SELECT *
        FROM refaccion_orden
        WHERE orden_id = ?
      `, [ordenId]);
      return results;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async agregarRefaccion(refacciones) {
    await this.connect();
    try {
      let result = true; // Cambia esto a true inicialmente
      const refaccionOrdenIds = [];
      let message = ""; // Inicializa el mensaje como vacío
  
      for (const refaccion of refacciones) {
        const { numero_parte, descripcion, cantidad, precio, ganancia, orden_id, refaccion_id } = refaccion;
  
        if (refaccion_id) {
          // Verificar si la refacción ya existe en la orden de trabajo
          const [existingRefaccion] = await this.connection.execute(
            'SELECT id, cantidad FROM refaccion_orden WHERE numero_parte = ? AND orden_id = ? AND refaccion_id = ?',
            [numero_parte, orden_id, refaccion_id]
          );
  
          if (existingRefaccion.length > 0) {
            // La refacción ya existe en la orden de trabajo, actualizar la cantidad
            const existingCantidad = existingRefaccion[0].cantidad;
  
            // Verificar stock en la tabla refaccion
            const [stockRefaccion] = await this.connection.execute(
              'SELECT cantidad FROM refaccion WHERE id = ?',
              [refaccion_id]
            );
  
            if (stockRefaccion.length > 0) {
              const stockCantidad = stockRefaccion[0].cantidad;
              const nuevaCantidad = existingCantidad + cantidad;
  
              if (nuevaCantidad <= stockCantidad) {
                // Actualizar la cantidad en refaccion_orden
                await this.connection.execute(
                  'UPDATE refaccion_orden SET cantidad = ? WHERE id = ?',
                  [nuevaCantidad, existingRefaccion[0].id]
                );
                refaccionOrdenIds.push(existingRefaccion[0].id);
              } else {
                // Si la cantidad excede el stock, solo agregar la cantidad máxima disponible
                await this.connection.execute(
                  'UPDATE refaccion_orden SET cantidad = ? WHERE id = ?',
                  [stockCantidad, existingRefaccion[0].id]
                );
                refaccionOrdenIds.push(existingRefaccion[0].id);
              }
            } else {
              result = false; // Cambia a false si no hay stock
              message = `No hay stock disponible para la refacción con ID ${refaccion_id}`;
            }
          } else {
            // La refacción no existe en la orden de trabajo, insertar una nueva entrada
            const [stockRefaccion] = await this.connection.execute(
              'SELECT cantidad FROM refaccion WHERE id = ?',
              [refaccion_id]
            );
  
            if (stockRefaccion.length > 0) {
              const stockCantidad = stockRefaccion[0].cantidad;
  
              if (cantidad <= stockCantidad) {
                const [resultInsert] = await this.connection.execute(
                  'INSERT INTO refaccion_orden (numero_parte, descripcion, cantidad, precio, ganancia, orden_id, refaccion_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [numero_parte, descripcion, cantidad, precio, ganancia, orden_id, refaccion_id]
                );
                refaccionOrdenIds.push(resultInsert.insertId);
              } else {
                // Si la cantidad excede el stock, solo agregar la cantidad máxima disponible
                const [resultInsert] = await this.connection.execute(
                  'INSERT INTO refaccion_orden (numero_parte, descripcion, cantidad, precio, ganancia, orden_id, refaccion_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                  [numero_parte, descripcion, stockCantidad, precio, ganancia, orden_id, refaccion_id]
                );
                refaccionOrdenIds.push(resultInsert.insertId);
              }
            } else {
              result = false; // Cambia a false si no hay stock
              message = `No hay stock disponible para la refacción con ID ${refaccion_id}`;
            }
          }
        } else {
          // Refacción sin refaccion_id
          // Validar que el numero_parte no exista en la tabla refaccion
          const [existingRefaccionGeneral] = await this.connection.execute(
            'SELECT id FROM refaccion WHERE numero_parte = ?',
            [numero_parte]
          );
  
          if (existingRefaccionGeneral.length > 0) {
            result = false; // Cambia a false si existe en refaccion
            message = `La refacción con numero de parte ${numero_parte} ya existe en la tabla refaccion`;
          }
  
          // Verificar si la refacción ya existe en la orden de trabajo
          const [existingRefaccionOrden] = await this.connection.execute(
            'SELECT id, cantidad FROM refaccion_orden WHERE numero_parte = ? AND orden_id = ?',
            [numero_parte, orden_id]
          );
  
          if (existingRefaccionOrden.length > 0) {
            // La refacción ya existe en la orden de trabajo, actualizar la cantidad
            const existingCantidad = existingRefaccionOrden[0].cantidad;
            const nuevaCantidad = existingCantidad + cantidad;
  
            // No hay necesidad de verificar el stock aquí, ya que no existe en la tabla refaccion
            await this.connection.execute(
              'UPDATE refaccion_orden SET cantidad = ? WHERE id = ?',
              [nuevaCantidad, existingRefaccionOrden[0].id]
            );
            refaccionOrdenIds.push(existingRefaccionOrden[0].id);
          } else {
            // La refacción no existe en la orden de trabajo, insertar una nueva entrada
            const [resultInsert] = await this.connection.execute(
              'INSERT INTO refaccion_orden (numero_parte, descripcion, cantidad, precio, ganancia, orden_id) VALUES (?, ?, ?, ?, ?, ?)',
              [numero_parte, descripcion, cantidad, precio, ganancia, orden_id]
            );
            refaccionOrdenIds.push(resultInsert.insertId);
          }
        }
      }
  
      const response = { result, refaccionOrdenIds, message };
      return response;
    } catch (error) {
      // Maneja el error y establece el mensaje en el caso de una excepción
      return { result: false, refaccionOrdenIds: [], message: error.message }; // Devuelve el mensaje de error
    } finally {
      await this.disconnect();
    }
  }  

  async eliminarRefaccion(refaccionId) {
    await this.connect();
    try {
      const [result] = await this.connection.execute(
        'DELETE FROM refaccion_orden WHERE id = ?',
        [refaccionId]
      );
      
      return result.insertId;
    } catch (error) {
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  async finalizarYRegistrarUtilidad({ total, manoObra, tipoPago, ordenId, clienteId, empleadoId, sucursalId, paquetes }) {
    await this.connect();
    try {
        // Iniciar transacción
        await this.connection.beginTransaction();

        // Obtener los nombres de los paquetes utilizados en la orden
        const paquetesUsados = await this.obtenerPaquetesUsados(ordenId, this.connection);
        console.log("Paquetes usados: ", paquetesUsados);

        // Calcular la ganancia de los paquetes (35% del total de cada paquete)
        let gananciaPaquetes = 0;
        for (const paquete of paquetesUsados) {
          const gananciaPaquete = paquete.precio * 0.35;
          gananciaPaquetes += gananciaPaquete;
        }
        console.log("Ganancia de paquetes: ", gananciaPaquetes);

        // Obtener refacciones de la tabla refaccion_orden
        const refaccionesOrden = await this.obtenerRefaccionesOrden(ordenId, this.connection);
        console.log("Refacciones usadas: ", refaccionesOrden);

        // Calcular la ganancia de las refacciones
        let gananciaRefacciones = 0;
        for (const refaccion of refaccionesOrden) {
            const gananciaRefaccion = ((refaccion.precio / 100) * refaccion.ganancia) * refaccion.cantidad;
            gananciaRefacciones += gananciaRefaccion;
        }
        console.log("Ganancia de refacciones: ", gananciaRefacciones);
        console.log("Ganancia de mano de obra: ", manoObra);

        // Calcular la ganancia total sumando la mano de obra
        const gananciaTotal = gananciaPaquetes + gananciaRefacciones + manoObra;
        console.log("Ganancia total: ", gananciaTotal);

        // Finalizar la orden de trabajo
        await this.finalizarOrden(ordenId, this.connection);

        // Registrar la utilidad
        const utilidadId = await this.registrarUtilidad({
            total,
            ganancia: gananciaTotal,
            tipoPago: tipoPago,
            orden_trabajo_id: ordenId,
            cliente_id: clienteId,
            empleado_id: empleadoId,
            sucursal_id: sucursalId,
            connection: this.connection
        });

        // Confirmar transacción
        await this.connection.commit();
        return utilidadId;
    } catch (error) {
        // Hacer rollback en caso de error
        await this.connection.rollback();
        throw error;
    } finally {
        await this.disconnect();
    }
}

  async obtenerPaquetesUsados(ordenId, connection) {
      try {
          const [rows] = await connection.execute(
              'SELECT nombre, precio FROM paquete_orden WHERE orden_id = ?',
              [ordenId]
          );
          return rows;
      } catch (error) {
          throw error;
      }
  }

  async obtenerRefaccionesOrden(ordenId, connection) {
      try {
          const [rows] = await connection.execute(
              'SELECT refaccion_id AS id, precio, ganancia, cantidad FROM refaccion_orden WHERE orden_id = ?',
              [ordenId]
          );
          return rows;
      } catch (error) {
          throw error;
      }
  }

  async actualizarStockRefaccion(refaccionId, cantidad, connection) {
      try {
          const [result] = await connection.execute(
              'UPDATE refaccion SET cantidad = cantidad - ? WHERE id = ?',
              [cantidad, refaccionId]
          );
          return result;
      } catch (error) {
          throw error;
      }
  }

  async finalizarOrden(id, connection) {
      try {
          const [result] = await connection.execute(
              'UPDATE orden_trabajo SET estado = "Completado" WHERE id = ?',
              [id]
          );
          return result;
      } catch (error) {
          throw error;
      }
  }

  async registrarUtilidad({ total, ganancia, tipoPago, orden_trabajo_id, cliente_id, empleado_id, sucursal_id, connection }) {
      try {
          const [result] = await connection.execute(
              'INSERT INTO utilidad (total, ganancia, tipo_pago, fecha, orden_trabajo_id, cliente_id, empleado_id, sucursal_id) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)',
              [total, ganancia, tipoPago, orden_trabajo_id, cliente_id, empleado_id, sucursal_id]
          );
          return result.insertId;
      } catch (error) {
          throw error;
      }
  }
}

module.exports = OrdenTrabajoModel;
