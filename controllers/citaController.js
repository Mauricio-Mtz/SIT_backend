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
      console.error('Error al obtener las citas:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async aprobarCita(req, res) {
    try {
      const affectedRows = await this.citaModel.aprobarCita(req.params.id);
      if (affectedRows == 0) {
        return res.status(404).json({ message: 'Cita no encontrada' });
      }
      const message = 'Cita aprobada';
      res.status(200).json({ message });
    } catch (error) {
      console.error('Error al aprobar la cita:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async cancelarCita(req, res) {
    try {
      const affectedRows = await this.citaModel.cancelarCita(req.params.id);
      if (affectedRows == 0) {
        return res.status(404).json({ message: 'Cita no encontrada' });
      }
      const message = 'Cita cancelada';
      res.status(200).json({ message });
    } catch (error) {
      console.error('Error al cancelar la cita:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
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
      const citaId = await this.citaModel.crearCita(req.body);
      if (citaId) {
        res.status(200).json({ message: "Cita agregada correctamente", citaId });
      } else {
        res.status(401).json({ message: "Error al agregar la cita" });
      }
    } catch (error) {
      console.error("Error al crear la cita:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
}

module.exports = new citaController();
