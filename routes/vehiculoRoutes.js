const express = require('express');
const router = express.Router();
const vehiculoController = require('../controllers/vehiculoController');

router.get('/vehiculosCliente/:id', vehiculoController.vehiculosCliente.bind(vehiculoController));

module.exports = router;
