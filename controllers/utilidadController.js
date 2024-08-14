const UtilidadModel = require('../models/utilidadModel');
const fsP = require('fs').promises;
const path = require('path');

class UtilidadController {
  constructor() {
    this.utilidadModel = new UtilidadModel();
  }

  async obtenerTodas(req, res) {
    try {
      const utilidades = await this.utilidadModel.obtenerTodas();
      res.status(200).json(utilidades);
    } catch (error) {
      console.error('Error al obtener las utilidades:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerVentasPorPeriodo(req, res) {
    const { sucursal_id, fecha_inicio, fecha_fin } = req.body; // Recibimos el ID de la sucursal y las fechas
    try {
      const ventas = await this.utilidadModel.obtenerVentasPorPeriodo(sucursal_id, fecha_inicio, fecha_fin);
      res.status(200).json(ventas);
    } catch (error) {
      console.error("Error al obtener las ventas por periodo:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
  
  async obtenerDetalleUtilidad(req, res) {
    const { id } = req.params;
    try {
      // Obtener datos de utilidad y detalles de la orden
      const utilidad = await this.utilidadModel.obtenerDetalleUtilidad(id);
      if (!utilidad) {
        return res.status(404).json({ message: "Utilidad no encontrada" });
      }

      // Obtener los paquetes desde la base de datos
      const paquetesOrden = await this.utilidadModel.obtenerPaquetesOrden(utilidad.ordenId);
      // Obtener las refacciones desde la base de datos
      const refaccionesOrden = await this.utilidadModel.obtenerRefaccionesOrden(utilidad.ordenId);
      
      // Leer el JSON de paquetes
      const filePath = path.join(__dirname, '..', 'config', 'json', 'paquetes.json');
      const data = await fsP.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(data);

      // Combinar la información de la base de datos con la del JSON
      const paquetesConRefacciones = paquetesOrden.map(paquete => {
        const paqueteJson = jsonData.paquetes.find(p => p.nombre === paquete.nombre);
        return {
          nombre: paquete.nombre,
          precio: paquete.precio,
          refacciones: paqueteJson ? paqueteJson.refacciones : []
        };
      });

      // Añadir los paquetes al resultado de utilidad
      utilidad.paquetes = paquetesConRefacciones;
      utilidad.refacciones = refaccionesOrden;

      res.status(200).json(utilidad);
    } catch (error) {
      console.error("Error al obtener el detalle de la utilidad:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  async obtenerPaquetesJson(req, res) {
    const filePath = path.join(__dirname, '..', 'config', 'json', 'paquetes.json');

    try {
      await fsP.access(filePath);
      const data = await fsP.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(data);
      return res.status(200).json({jsonData, result: true});
    } catch (error) {
      return res.status(200).json({ message: 'Archivo de diagnóstico no encontrado', result: false });
    }
  }
}

module.exports = new UtilidadController();
