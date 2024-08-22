const express = require('express');
const router = express.Router();
const ordenTrabajoController = require('../controllers/ordenTrabajoController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      const tempDir = path.join(__dirname, '..', 'temp'); // Ruta relativa a la ubicación actual del archivo
      cb(null, tempDir); // Guardar archivos en la carpeta temp
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname); // Usar el nombre original del archivo
  }
});
const upload = multer({ storage: storage });

router.get('/obtenerTodas', ordenTrabajoController.obtenerTodas.bind(ordenTrabajoController));
router.get('/obtenerPorEmpleado/:id', ordenTrabajoController.obtenerPorEmpleado.bind(ordenTrabajoController));
router.delete('/eliminar/:id', ordenTrabajoController.eliminar.bind(ordenTrabajoController));

router.get('/obtenerDiagnostico/:folio', ordenTrabajoController.obtenerDiagnostico.bind(ordenTrabajoController));
router.post('/guardarDiagnostico', upload.single('pdf'), ordenTrabajoController.guardarDiagnostico.bind(ordenTrabajoController));
router.post('/modificarDiagnostico', upload.single('pdf'), ordenTrabajoController.modificarDiagnostico.bind(ordenTrabajoController));

router.get('/obtenerDetallesCotizacion/:id/:folio', ordenTrabajoController.obtenerDetallesCotizacion.bind(ordenTrabajoController));
router.get('/obtenerCotizacion/:folio', ordenTrabajoController.obtenerCotizacion.bind(ordenTrabajoController));
router.post('/guardarCotizacion', upload.single('pdf'), ordenTrabajoController.guardarCotizacion.bind(ordenTrabajoController));
router.post('/modificarCotizacion', upload.single('pdf'), ordenTrabajoController.modificarCotizacion.bind(ordenTrabajoController));

router.get('/obtenerReparacion/:folio', ordenTrabajoController.obtenerReparacion.bind(ordenTrabajoController));
router.post('/modificarReparacion', ordenTrabajoController.modificarReparacion.bind(ordenTrabajoController));
router.post('/finalizarReparacion', ordenTrabajoController.finalizarReparacion.bind(ordenTrabajoController));

router.post('/verificarContrasena', ordenTrabajoController.verificarContrasena.bind(ordenTrabajoController));
router.get('/serviciosPorOrden/:id', ordenTrabajoController.serviciosPorOrden.bind(ordenTrabajoController));
router.post('/registrar', ordenTrabajoController.createOrdenTrabajo.bind(ordenTrabajoController));

router.post('/agregarPaquete', ordenTrabajoController.agregarPaquete.bind(ordenTrabajoController));
router.get('/obtenerPaquetes/:id', ordenTrabajoController.obtenerPaquetes.bind(ordenTrabajoController));
router.post('/eliminarPaquete', ordenTrabajoController.eliminarPaquete.bind(ordenTrabajoController));
router.post('/verificarPaquete', ordenTrabajoController.verificarPaquete.bind(ordenTrabajoController));

router.get('/obtenerRefaccionesAsignadas/:id', ordenTrabajoController.obtenerRefaccionesAsignadas.bind(ordenTrabajoController));
router.post('/agregarRefaccion', ordenTrabajoController.agregarRefaccion.bind(ordenTrabajoController));
router.post('/eliminarRefaccion', ordenTrabajoController.eliminarRefaccion.bind(ordenTrabajoController));

router.post('/finalizarOrden', ordenTrabajoController.finalizarOrden.bind(ordenTrabajoController));

module.exports = router;