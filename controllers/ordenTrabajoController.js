const fsP = require('fs').promises;
const fs = require('fs');
const path = require('path');
const OrdenTrabajoModel = require('../models/ordenTrabajoModel');
const nodemailer = require('nodemailer');

// Configura el transporte de Nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'maurimtz07@gmail.com', // tu correo electrónico
    pass: 'rwxo xzjd ikrz yaxj' // tu contraseña de correo electrónico
  }
});

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

  async eliminar(req, res) {
    try {
      const result = await this.ordenTrabajoModel.eliminar(req.params.id);
  
      if (!result.success) {
        return res.status(400).json({
          message: result.message,
          details: result.details,
        });
      }
  
      res.status(200).json({
        message: result.message,
        details: result.details,
      });
    } catch (error) {
      console.error('Error al eliminar la orden de trabajo:', error);
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
    const { ordenFolio, correo, diagnosticoCompleto } = req.body;
    const filePath = path.join(__dirname, '..', 'diagnosticos', `${ordenFolio}.json`);

    try {
      // Guardar el archivo JSON
      await fsP.writeFile(filePath, JSON.stringify(JSON.parse(diagnosticoCompleto), null, 2), 'utf8');

      // Guardar el archivo PDF si existe
      if (req.file && req.file.path) {
        console.log('Ruta temporal del archivo PDF recibido:', req.file.path);

        const pdfFilePath = path.join(__dirname, '..', 'diagnosticos', `${ordenFolio}.pdf`);
        console.log('Ruta final del archivo PDF:', pdfFilePath);

        // Mover el archivo PDF a la ruta final
        await fsP.rename(req.file.path, pdfFilePath);

        // Verifica si el archivo PDF se ha movido correctamente
        if (await fsP.access(pdfFilePath).then(() => true).catch(() => false)) {
          console.log('Archivo PDF creado correctamente:', pdfFilePath);

          // Enviar el archivo PDF por correo
          const mailOptions = {
            from: 'mecanico.express.qro@gmail.com', // Reemplaza con tu email de remitente
            to: correo, // Dirección de correo proporcionada en el request
            subject: `Diagnóstico ${ordenFolio}`,
            text: 'Envío de diagnóstico de parte de Mecánico Express, se adjunta archivo en PDF del diagnóstico.',
            attachments: [
              {
                filename: `${ordenFolio}.pdf`,
                path: pdfFilePath
              }
            ]
          };

          // Enviar el correo
          await transporter.sendMail(mailOptions);
          console.log('Correo enviado exitosamente');

          // Eliminar el archivo PDF después de enviarlo
          await fsP.unlink(pdfFilePath);
        } else {
          console.log('No se pudo encontrar el archivo PDF después de moverlo.');
        }
      }

      // Actualizar el estado del diagnóstico
      const updatedRows = await this.ordenTrabajoModel.finalizaDiagnostico(ordenFolio);
      res.status(200).json({ message: 'Archivo guardado exitosamente', resultado: updatedRows });
    } catch (error) {
      console.error('Error al guardar el diagnóstico:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async modificarDiagnostico(req, res) {
    const { ordenFolio, correo, diagnosticoCompleto } = req.body;
    const filePath = path.join(__dirname, '..', 'diagnosticos', `${ordenFolio}.json`);

    try {
      // Verifica si el archivo existe
      const fileExists = await fsP.access(filePath).then(() => true).catch(() => false);

      // Escribe el contenido en el archivo (reemplaza si existe)
      await fsP.writeFile(filePath, JSON.stringify(JSON.parse(diagnosticoCompleto), null, 2), 'utf8');

      // Guardar el archivo PDF si existe
      if (req.file && req.file.path) {
        console.log('Ruta temporal del archivo PDF recibido:', req.file.path);

        const pdfFilePath = path.join(__dirname, '..', 'diagnosticos', `${ordenFolio}.pdf`);
        console.log('Ruta final del archivo PDF:', pdfFilePath);

        // Mover el archivo PDF a la ruta final
        await fsP.rename(req.file.path, pdfFilePath);

        // Verifica si el archivo PDF se ha movido correctamente
        if (await fsP.access(pdfFilePath).then(() => true).catch(() => false)) {
          console.log('Archivo PDF creado correctamente:', pdfFilePath);

          // Enviar el archivo PDF por correo
          const mailOptions = {
            from: 'mecanico.express.qro@gmail.com', // Reemplaza con tu email de remitente
            to: correo, // Dirección de correo proporcionada en el request
            subject: `Diagnóstico ${ordenFolio} Modificado`,
            text: 'Debido a cambios realizados se reenvía de parte de Mecànico Express el diagnóstico, se adjunta archivo en PDF de la moficación del diagnóstico.',
            attachments: [
              {
                filename: `${ordenFolio}.pdf`,
                path: pdfFilePath
              }
            ]
          };

          // Enviar el correo
          await transporter.sendMail(mailOptions);
          console.log('Correo enviado exitosamente');

          // Eliminar el archivo PDF después de enviarlo
          await fsP.unlink(pdfFilePath);
        } else {
          console.log('No se pudo encontrar el archivo PDF después de moverlo.');
        }
      }

      res.status(200).json({ message: fileExists ? 'Archivo reemplazado exitosamente' : 'Archivo creado exitosamente' });
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
    // Extraer datos JSON del body
    const { ordenFolio, correo, reparacion, cotizacionCompleta } = req.body;
    const filePathCotizacion = path.join(__dirname, '..', 'cotizaciones', `${ordenFolio}.json`);
    const filePathReparacion = path.join(__dirname, '..', 'reparaciones', `${ordenFolio}.json`);

    try {
      // Guardar JSON
      await fsP.writeFile(filePathCotizacion, JSON.stringify(JSON.parse(cotizacionCompleta), null, 2), 'utf8');
      await fsP.writeFile(filePathReparacion, JSON.stringify(JSON.parse(reparacion), null, 2), 'utf8');

      // Guardar el archivo PDF si existe
      if (req.file && req.file.path) {
        console.log('Ruta temporal del archivo PDF recibido:', req.file.path);

        const pdfFilePath = path.join(__dirname, '..', 'cotizaciones', `${ordenFolio}.pdf`);
        console.log('Ruta final del archivo PDF:', pdfFilePath);

        // Mover el archivo PDF a la ruta final
        await fsP.rename(req.file.path, pdfFilePath);

        // Verifica si el archivo PDF se ha movido correctamente
        if (await fsP.access(pdfFilePath).then(() => true).catch(() => false)) {
          console.log('Archivo PDF creado correctamente:', pdfFilePath);

          // Enviar el archivo PDF por correo
          const mailOptions = {
            from: 'mecanico.express.qro@gmail.com', // Reemplaza con tu email de remitente
            to: [correo], // Dirección de correo a la que se enviará el archivo
            subject: `Cotización ${ordenFolio}`,
            text: 'Envío de cotización de parte de Mecánico Express, se adjunta archivo en PDF de la cotización.',
            attachments: [
              {
                filename: `${ordenFolio}.pdf`,
                path: pdfFilePath
              }
            ]
          };

          // Enviar el correo
          await transporter.sendMail(mailOptions);
          console.log('Correo enviado exitosamente');

          // Eliminar el archivo PDF después de enviarlo
          await fsP.unlink(pdfFilePath);
        } else {
          console.log('No se pudo encontrar el archivo PDF después de moverlo.');
        }
      }

      res.status(200).json({ message: 'Cotización guardada y enviada por correo exitosamente' });
    } catch (error) {
      console.error('Error al guardar y enviar la cotización:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async modificarCotizacion(req, res) {
    // Extraer datos JSON del body
    const { ordenFolio, correo, reparacion, cotizacionCompleta } = req.body;
    const filePathCotizacion = path.join(__dirname, '..', 'cotizaciones', `${ordenFolio}.json`);
    const filePathReparacion = path.join(__dirname, '..', 'reparaciones', `${ordenFolio}.json`);
    
    try {
      // Verifica si el archivo existe
      const fileExists = await fsP.access(filePathCotizacion).then(() => true).catch(() => false);
    
      // Escribe el contenido en el archivo (reemplaza si existe)
      await fsP.writeFile(filePathCotizacion, JSON.stringify(JSON.parse(cotizacionCompleta), null, 2), 'utf8');
      await fsP.writeFile(filePathReparacion, JSON.stringify(JSON.parse(reparacion), null, 2), 'utf8');

      // Guardar el archivo PDF si existe
      if (req.file && req.file.path) {
        console.log('Ruta temporal del archivo PDF recibido:', req.file.path);

        const pdfFilePath = path.join(__dirname, '..', 'cotizaciones', `${ordenFolio}.pdf`);
        console.log('Ruta final del archivo PDF:', pdfFilePath);

        // Mover el archivo PDF a la ruta final
        await fsP.rename(req.file.path, pdfFilePath);

        // Verifica si el archivo PDF se ha movido correctamente
        if (await fsP.access(pdfFilePath).then(() => true).catch(() => false)) {
          console.log('Archivo PDF creado correctamente:', pdfFilePath);

          // Enviar el archivo PDF por correo
          const mailOptions = {
            from: 'mecanico.express.qro@gmail.com', // Reemplaza con tu email de remitente
            to: ['correo'],
            subject: `Cotización ${ordenFolio} Modificada`,
            text: 'Debido a cambios realizado en la cotización se reenvía la cotización de parte de Mecánico Express. Se adjunta archivo en PDF de la cotización modificada.',
            attachments: [
              {
                filename: `${ordenFolio}.pdf`,
                path: pdfFilePath
              }
            ]
          };

          // Enviar el correo
          await transporter.sendMail(mailOptions);
          console.log('Correo enviado exitosamente');

          // Eliminar el archivo PDF después de enviarlo
          await fsP.unlink(pdfFilePath);
        } else {
          console.log('No se pudo encontrar el archivo PDF después de moverlo.');
        }
      }
    
      res.status(200).json({
        message: fileExists ? 'Archivo reemplazado y enviado por correo exitosamente' : 'Archivo creado y enviado por correo exitosamente',
      });
    } catch (error) {
      console.error('Error al guardar y enviar la cotización:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }

  async obtenerReparacion(req, res) {
    const filePath = path.join(__dirname, '..', 'reparaciones', `${req.params.folio}.json`);

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

  async modificarReparacion(req, res) {
    const { reparacion, ordenFolio } = req.body;
    const filePath = path.join(__dirname, '..', 'reparaciones', `${ordenFolio}.json`);
  
    try {
      // Verifica si el archivo existe
      const fileExists = await fsP.access(filePath).then(() => true).catch(() => false);
  
      // Escribe el contenido en el archivo (reemplaza si existe)
      await fsP.writeFile(filePath, JSON.stringify(reparacion, null, 2), 'utf8');
  
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

  async finalizarReparacion(req, res) {
    try {
      const { ordenId } = req.body; // Asegúrate de obtener 'ordenId' del body del request
      const result = await this.ordenTrabajoModel.finalizarReparacion(ordenId); // Pasa el 'ordenId' a la función del modelo
      res.status(200).json(result); // Responde con el resultado
    } catch (error) {
      console.error('Error al finalizar la reparación:', error);
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
      console.error('Error al crear la orden de trabajo:', error.message);
      if (error.message.includes('El correo electrónico o el teléfono ya están en uso.')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Error interno del servidor' });
      }
    }
  }
  
  async agregarPaquete(req, res) {
    try {
      const resu = await this.ordenTrabajoModel.agregarPaquete(req.body);
      res.status(201).json({ result: resu.result, message: resu.message, response: resu.response });
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

  async verificarPaquete(req, res) {
    try {
      const result = await this.ordenTrabajoModel.verificarPaquete(req.body);
      res.status(201).json({ result });
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

  async finalizarOrden(req, res) {
    try {
      const { total, manoObra, tipoPago, ordenId, clienteId, empleadoId, sucursalId, paquetes } = req.body;
  
      // Finalizar la reparación, registrar la utilidad y actualizar el stock de refacciones
      const utilidad = await this.ordenTrabajoModel.finalizarYRegistrarUtilidad({
        total,
        manoObra,
        tipoPago,
        ordenId,
        clienteId,
        empleadoId,
        sucursalId,
        paquetes
      });
  
      res.status(200).json({ message: 'Orden finalizada, utilidad registrada y stock actualizado', utilidad });
    } catch (error) {
      console.error('Error al finalizar la orden:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
}

module.exports = new OrdenTrabajoController();
