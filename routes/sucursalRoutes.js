const express = require('express');
const router = express.Router();
const sucursalController = require('../controllers/sucursalController');

// router.post('/registrar', sucursalController.registrar.bind(sucursalController));
router.get('/obtenerTodas', sucursalController.obtenerTodas.bind(sucursalController));
// router.get('/obtenerUna/:id', sucursalController.obtenerUna.bind(sucursalController));
// router.put('/actualizar/:id', sucursalController.actualizar.bind(sucursalController));
// router.delete('/eliminar/:id', sucursalController.eliminar.bind(sucursalController));

module.exports = router;
