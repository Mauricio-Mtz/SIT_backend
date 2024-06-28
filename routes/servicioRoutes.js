const express = require('express');
const router = express.Router();
const servicioController = require('../controllers/servicioController');

router.get('/obtenerTodos', servicioController.obtenerTodos.bind(servicioController));
router.get('/obtenerUna/:id', servicioController.obtenerUna.bind(servicioController));

module.exports = router;
