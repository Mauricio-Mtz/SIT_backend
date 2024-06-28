const fs = require('fs');
const path = require('path');
const OrdenTrabajoModel = require('../models/ordenTrabajoModel');

class OrdenTrabajoController {
  constructor() {
    this.ordenTrabajoModel = new OrdenTrabajoModel();
  }

  async obtenerPorEmpleado(req, res) {
    try {
      const ordenes = await this.ordenTrabajoModel.obtenerPorEmpleado(req.params.id);
      res.status(200).json(ordenes);
    } catch (error) {
      console.error('Error al obtener las órdenes de trabajo:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  obtenerDiagnostico(req, res) {
    const filePath = path.join(__dirname, '..', 'diagnosticos', `${req.params.folio}.json`);

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error al leer el archivo JSON:', err);
        return res.status(500).json({ message: 'Error interno del servidor' });
      }

      try {
        const jsonData = JSON.parse(data);
        res.status(200).json(jsonData);
      } catch (parseError) {
        console.error('Error al parsear el archivo JSON:', parseError);
        res.status(500).json({ message: 'Error interno del servidor' });
      }
    });
  }

  async siguientePaso(req, res) {
    const { ordenId, ordenFolio, diagnosticoCompleto, proceso, estado, serviciosSeleccionados, refaccionesOrden } = req.body;
    const filePath = path.join(__dirname, '..', 'diagnosticos', `${ordenFolio}.json`);
  
    try {
      if (diagnosticoCompleto) {
        fs.writeFileSync(filePath, JSON.stringify(diagnosticoCompleto, null, 2), 'utf8');
      }
  
      const fecha = new Date();
      await this.ordenTrabajoModel.siguientePaso(ordenId, fecha, proceso, estado, serviciosSeleccionados, refaccionesOrden);
  
      res.status(200).json({ message: `${estado} guardado exitosamente` });
    } catch (error) {
      console.error(`Error al guardar el estado ${estado}:`, error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerDetallesCotizacion(req, res) {
    try {
      const detallesCotizacion = await this.ordenTrabajoModel.obtenerDetallesCotizacion(req.params.id);
      res.status(200).json(detallesCotizacion);
    } catch (error) {
      console.error('Error al obtener detalles de cotización:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
  
  
}

module.exports = new OrdenTrabajoController();
