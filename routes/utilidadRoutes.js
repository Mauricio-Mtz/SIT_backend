const express = require('express');
const router = express.Router();
const utilidadController = require('../controllers/utilidadController');

router.get('/obtenerTodas', utilidadController.obtenerTodas.bind(utilidadController));
router.post('/obtenerPorPeriodo', utilidadController.obtenerVentasPorPeriodo.bind(utilidadController));
router.get('/obtenerDetalleUtilidad/:id', utilidadController.obtenerDetalleUtilidad.bind(utilidadController));

module.exports = router;
