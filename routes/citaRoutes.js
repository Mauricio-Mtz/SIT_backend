const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');

router.get('/obtenerTodas/:sucursal', citaController.obtenerTodas.bind(citaController));
router.get('/aprobarCita/:id', citaController.aprobarCita.bind(citaController)); // Cambiado a POST
router.get('/cancelarCita/:id', citaController.cancelarCita.bind(citaController)); // Cambiado a POST
router.get('/obtenerClientePorFolio/:folio', citaController.obtenerClientePorFolio.bind(citaController));
router.get('/obtenerFechaHoraCitas', citaController.obtenerFechaHoraCitas.bind(citaController));
router.post('/crearCita', citaController.crearCita.bind(citaController)); // Ejemplo de POST existente 
router.put('/aprobarOrdenTrabajo', citaController.aprobarOrdenTrabajo.bind(citaController));

module.exports = router;
