const fsP = require('fs').promises;
const fs = require('fs');
const path = require('path');
const JsonModel = require("../models/jsonModel");

class jsonController {
  constructor() {
    this.jsonModel = new JsonModel();
  }

  async obtenerPaquetesJson(req, res) {
    const filePath = path.join(__dirname, '..', 'config', 'json', 'paquetes.json');

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

  async modificarPaquetesJson(req, res) {
    const { nuevosPaquetes } = req.body;
    const filePath = path.join(__dirname, '..', 'config', 'json', 'paquetes.json');
    
    try {
      // Verifica si el archivo existe
      const fileExists = await fsP.access(filePath).then(() => true).catch(() => false);
      // Escribe el contenido en el archivo (reemplaza si existe)
      await fsP.writeFile(filePath, JSON.stringify(nuevosPaquetes, null, 2), 'utf8');
      if (fileExists) {
        res.status(200).json({ message: 'Archivo reemplazado exitosamente' });
      } else {
        res.status(200).json({ message: 'Archivo creado exitosamente' });
      }
    } catch (error) {
      console.error('Error al guardar los nuevos paquetes:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  }
}

module.exports = new jsonController();
