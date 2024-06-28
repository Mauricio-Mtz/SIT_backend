const express = require('express');
const router = express.Router();
const ordenTrabajoController = require('../controllers/ordenTrabajoController');

router.get('/obtenerTodas', ordenTrabajoController.obtenerTodas.bind(ordenTrabajoController));
router.get('/obtenerPorEmpleado/:id', ordenTrabajoController.obtenerPorEmpleado.bind(ordenTrabajoController));
router.get('/obtenerDiagnostico/:folio', ordenTrabajoController.obtenerDiagnostico.bind(ordenTrabajoController));
router.post('/siguientePaso', ordenTrabajoController.siguientePaso.bind(ordenTrabajoController));
router.post('/anteriorPaso', ordenTrabajoController.anteriorPaso.bind(ordenTrabajoController));
router.get('/obtenerDetallesCotizacion/:id', ordenTrabajoController.obtenerDetallesCotizacion.bind(ordenTrabajoController));
router.post('/verificarContrasena', ordenTrabajoController.verificarContrasena.bind(ordenTrabajoController));

module.exports = router;
