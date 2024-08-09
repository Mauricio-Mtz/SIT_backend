const CitaModel = require("../models/citaModel");

class citaController {
  constructor() {
    this.citaModel = new CitaModel();
  }

  async obtenerTodas(req, res) {
    try {
      const citas = await this.citaModel.obtenerTodas(req.params.sucursal);
      res.status(200).json(citas);
    } catch (error) {
      console.error("Error al obtener las citas:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  async aprobarCita(req, res) {
    try {
      const affectedRows = await this.citaModel.aprobarCita(req.params.id);
      if (affectedRows == 0) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      const message = "Cita aprobada";
      res.status(200).json({ message });
    } catch (error) {
      console.error("Error al aprobar la cita:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  async cancelarCita(req, res) {
    try {
      const affectedRows = await this.citaModel.cancelarCita(req.params.id);
      if (affectedRows == 0) {
        return res.status(404).json({ message: "Cita no encontrada" });
      }
      const message = "Cita cancelada";
      res.status(200).json({ message });
    } catch (error) {
      console.error("Error al cancelar la cita:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  async obtenerClientePorFolio(req, res) {
    try {
      const cliente = await this.citaModel.obtenerClientePorFolio(
        req.params.folio
      );
      if (!cliente) {
        return res.status(401).json({ message: "No se encontraron clientes" });
      }
      res.status(200).json(cliente);
    } catch (error) {
      console.error("Error al obtener al cliente:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  async obtenerFechaHoraCitas(req, res) {
    try {
      const fechaHora = await this.citaModel.obtenerFechaHoraCitas();
      res.status(200).json(fechaHora);
    } catch (error) {
      console.error("Error al obtener las fechas y horas:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  async crearCita(req, res) {
    try {
      // Validar campos requeridos
      if (!req.body.marca || !req.body.tipo || !req.body.año || !req.body.modelo) {
        return res.status(401).json({ message: "Completa toda la información del vehículo" });
      }
      if (!req.body.sucursal_id) {
        return res.status(401).json({ message: "No se ha seleccionado sucursal" });
      }
      if (!req.body.fecha || !req.body.hora) {
        return res.status(401).json({ message: "No se ha seleccionado fecha y hora" });
      }
  
      // Crear la cita
      const citaId = await this.citaModel.crearCita(req.body);
      if (citaId) {
        return res.status(200).json({ message: "Cita agregada correctamente", citaId });
      } else {
        return res.status(401).json({ message: "Error al agregar la cita" });
      }
    } catch (error) {
      console.error("Error al crear la cita:", error.message);
      if (error.message.includes('El correo electrónico o el teléfono ya están en uso.')) {
        return res.status(400).json({ message: error.message });
      } else {
        return res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  }
  

  async aprobarOrdenTrabajo(req, res) {
    let { citaId, nombre, apellido, numero, correo, contrasena, marca, modelo, año, tipo, descripcion, cliente, vehiculo, sucursal, empleado, } = req.body;
    try {
      // Crear folio de la orden de trabajo (ejemplo: OT-00001)
      const folioOT = await this.citaModel.generarNuevoFolio();
      
      // Crear cliente en caso de que no exista
      if (cliente === null) {
        const clienteId = await this.citaModel.crearCliente({
          nombre, apellido, numero, correo, contrasena
        })
        cliente = clienteId;
      }
      // Crear vehiculo en caso de que no exista
      if (vehiculo === null) {
        const vehiculoId = await this.citaModel.crearVehiculo({
          marca, modelo, tipo, año, cliente
        })
        vehiculo = vehiculoId;
      }

      // Crear la orden de trabajo en la base de datos
      const ordenTrabajoId = await this.citaModel.crearOrdenTrabajo({
        folio: folioOT,
        descripcion: descripcion,
        cliente_id: cliente,
        vehiculo_id: vehiculo,
        empleado_id: empleado,
        sucursal_id: sucursal,
      });

      // Aprobar la cita cambiando el estado a 3
      const citaAprobada = await this.citaModel.aprobarOrdenTrabajo(citaId);
      if (!citaAprobada) {
        return res.status(404).json({ message: "No se encontró la cita o ya fue aprobada" });
      }
      
      // Agregar servicios a la orden de trabajo en caso de tenerlos
      await this.citaModel.asignarServiciosAOrdenTrabajo(ordenTrabajoId, citaId);

      // Enviar respuesta con el id de la orden de trabajo creada
      res.status(200).json({message: "Cita aprobada y orden de trabajo creada", ordenTrabajoId,});
    } catch (error) {
      console.error(
        "Error al aprobar la cita y crear la orden de trabajo:",
        error
      );
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
}

module.exports = new citaController();
