const fsP = require('fs').promises;
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

  async obtenerTodas(req, res) {
    try {
      const ordenes = await this.ordenTrabajoModel.obtenerTodas();
      res.status(200).json(ordenes);
    } catch (error) {
      console.error('Error al obtener las órdenes de trabajo:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerDiagnostico(req, res) {
    const filePath = path.join(__dirname, '..', 'diagnosticos', `${req.params.folio}.json`);

    try {
      // Verifica si el archivo existe
      await fsP.access(filePath);
  
      // Lee el contenido del archivo
      const data = await fsP.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(data);
      return res.status(200).json({jsonData, result: true});
    } catch (error) {
      return res.status(200).json({ message: 'Archivo de diagnóstico no encontrado', result: false });
    }
  }

  async guardarDiagnostico(req, res) {
    const { diagnosticoCompleto, ordenId, ordenFolio, estado } = req.body;
    const filePath = path.join(__dirname, '..', 'diagnosticos', `${ordenFolio}.json`);
  
    try {
      fs.writeFileSync(filePath, JSON.stringify(diagnosticoCompleto, null, 2), 'utf8');
      const updatedRows = await this.ordenTrabajoModel.finalizaDiagnostico(ordenId, estado);
      res.status(200).json({ message: 'Archivo guardado exitosamente', resultado: updatedRows });
    } catch (error) {
      console.error(`Error al guardar el estado ${estado}:`, error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async modificarDiagnostico(req, res) {
    const { diagnosticoCompleto, ordenFolio } = req.body;
    const filePath = path.join(__dirname, '..', 'diagnosticos', `${ordenFolio}.json`);
  
    try {
      // Verifica si el archivo existe
      const fileExists = await fsP.access(filePath).then(() => true).catch(() => false);
  
      // Escribe el contenido en el archivo (reemplaza si existe)
      await fsP.writeFile(filePath, JSON.stringify(diagnosticoCompleto, null, 2), 'utf8');
  
      if (fileExists) {
        res.status(200).json({ message: 'Archivo reemplazado exitosamente' });
      } else {
        res.status(200).json({ message: 'Archivo creado exitosamente' });
      }
    } catch (error) {
      console.error('Error al guardar el diagnóstico:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerCotizacion(req, res) {
    const filePath = path.join(__dirname, '..', 'cotizaciones', `${req.params.folio}.json`);

    try {
      // Verifica si el archivo existe
      await fsP.access(filePath);
  
      // Lee el contenido del archivo
      const data = await fsP.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(data);
      return res.status(200).json({jsonData, result: true});
    } catch (error) {
      return res.status(200).json({ message: 'Archivo de diagnóstico no encontrado', result: false });
    }
  }

  async guardarCotizacion(req, res) {
    const { ordenId, ordenFolio, cotizacionCompleta, proceso, estado } = req.body;
    const filePath = path.join(__dirname, '..', 'cotizaciones', `${ordenFolio}.json`);
  
    try {
      fs.writeFileSync(filePath, JSON.stringify(cotizacionCompleta, null, 2), 'utf8');
  
      // await this.ordenTrabajoModel.siguientePaso(ordenId, proceso, estado);
  
      res.status(200).json({ message: `${estado} guardado exitosamente` });
    } catch (error) {
      console.error(`Error al guardar el estado ${estado}:`, error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async modificarCotizacion(req, res) {
    const { cotizacionCompleta, ordenFolio } = req.body;
    const filePath = path.join(__dirname, '..', 'cotizaciones', `${ordenFolio}.json`);
  
    try {
      // Verifica si el archivo existe
      const fileExists = await fsP.access(filePath).then(() => true).catch(() => false);
  
      // Escribe el contenido en el archivo (reemplaza si existe)
      await fsP.writeFile(filePath, JSON.stringify(cotizacionCompleta, null, 2), 'utf8');
  
      if (fileExists) {
        res.status(200).json({ message: 'Archivo reemplazado exitosamente' });
      } else {
        res.status(200).json({ message: 'Archivo creado exitosamente' });
      }
    } catch (error) {
      console.error('Error al guardar el diagnóstico:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerDetallesCotizacion(req, res) {
    const filePath = path.join(__dirname, '..', 'diagnosticos', `${req.params.folio}.json`);
    try {
      // Obtiene los detalles de la cotización
      const detallesCotizacion = await this.ordenTrabajoModel.obtenerDetallesCotizacion(req.params.id);
  
      let jsonData = null;
  
      try {
        // Verifica si el archivo del diagnóstico existe y lee el contenido del archivo
        await fsP.access(filePath);
        const data = await fsP.readFile(filePath, 'utf8');
        jsonData = JSON.parse(data);
      } catch (fileError) {
        // Si el archivo no existe, simplemente omite la información del diagnóstico
        if (fileError.code !== 'ENOENT') {
          throw fileError; // Lanza el error si no es por archivo no encontrado
        }
        // Si el archivo no se encuentra, jsonData permanece como null
      }
  
      // Crea la respuesta con la información disponible
      const cotizacion = { 
        cliente: jsonData ? jsonData.cliente : null, 
        vehiculo: jsonData ? jsonData.vehiculo : null,
        servicios: detallesCotizacion.servicios,
        refacciones: detallesCotizacion.refacciones
      };
  
      res.status(200).json(cotizacion);
    } catch (error) {
      // Maneja cualquier otro error
      console.error('Error al obtener detalles de cotización:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }  

  async verificarContrasena(req, res) {
    const { clave } = req.body;
  
    try {
      const isValid = await this.ordenTrabajoModel.verificarContrasena(clave);
      if (isValid) {
        res.status(200).json({ message: 'ok' });
      } else {
        res.status(401).json({ message: 'Clave incorrecta o el empleado no es administrador' });
      }
    } catch (error) {
      console.error('Error al verificar la contraseña:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async serviciosPorOrden(req, res) {
    try {
      const servicios = await this.ordenTrabajoModel.serviciosPorOrden(req.params.id);
      res.status(200).json(servicios);
    } catch (error) {
      console.error('Error al obtener los servicios:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async createOrdenTrabajo(req, res) {
    try {
      const ordenId = await this.ordenTrabajoModel.createOrdenTrabajo(req.body);
      res.status(201).json({ message: 'Orden de trabajo creada exitosamente', ordenId });
    } catch (error) {
      console.error('Error al crear la orden de trabajo:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async agregarPaquete(req, res) {
    try {
      const paqueteOrdenId = await this.ordenTrabajoModel.agregarPaquete(req.body);
      res.status(201).json({ message: 'Paquete asignado correctamente a la orden de trabajo', paqueteOrdenId });
    } catch (error) {
      console.error('Error al agregar paquete a la orden de trabajo:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerPaquetes(req, res) {
    try {
      const servicios = await this.ordenTrabajoModel.obtenerPaquetes(req.params.id);
      res.status(200).json(servicios);
    } catch (error) {
      console.error('Error al obtener los servicios:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
  
  async eliminarPaquete(req, res) {
    try {
      const paqueteOrdenId = await this.ordenTrabajoModel.eliminarPaquete(req.body);
      res.status(201).json({ message: 'Paquete eliminado correctamente a la orden de trabajo', paqueteOrdenId });
    } catch (error) {
      console.error('Error al eliminar paquete a la orden de trabajo:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerRefaccionesAsignadas(req, res) {
    try {
      const refacciones = await this.ordenTrabajoModel.obtenerRefaccionesAsignadas(req.params.id);
      res.status(200).json(refacciones);
    } catch (error) {
      console.error('Error al obtener las refacciones de la orden:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async agregarRefaccion(req, res) {
    try {
      const response = await this.ordenTrabajoModel.agregarRefaccion(req.body);
      
      // Establece el estado en función del resultado
      if (response.result) {
        res.status(201).json({
          message: response.message || "Refacciones agregadas correctamente.",
          refaccionOrdenIds: response.refaccionOrdenIds,
          result: response.result
        });
      } else {
        res.status(400).json({ // Cambia el estado a 400 para errores de cliente
          message: response.message || "Error al agregar refacción.",
          refaccionOrdenIds: response.refaccionOrdenIds,
          result: response.result
        });
      }
    } catch (error) {
      console.error('Error al agregar la refacción a la orden de trabajo:', error);
      res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
  }  
  
  async eliminarRefaccion(req, res) {
    try {
      const refaccionOrdenId = await this.ordenTrabajoModel.eliminarRefaccion(req.body.refaccionId);
      res.status(201).json({ message: 'Refaccion eliminada correctamente a la orden de trabajo', refaccionOrdenId });
    } catch (error) {
      console.error('Error al eliminar la refaccion de la orden de trabajo:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
}

module.exports = new OrdenTrabajoController();
