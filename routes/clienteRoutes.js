const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.post('/registrar', clienteController.registrar.bind(clienteController));
router.get('/obtenerTodos', clienteController.obtenerTodos.bind(clienteController));
router.get('/obtenerUno/:id', clienteController.obtenerUno.bind(clienteController));
router.put('/actualizar/:id', clienteController.actualizar.bind(clienteController));
router.delete('/eliminar/:id', clienteController.eliminar.bind(clienteController));

module.exports = router;
