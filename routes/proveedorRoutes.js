const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');

router.post('/registrar', proveedorController.registrar.bind(proveedorController));
router.get('/obtenerTodos', proveedorController.obtenerTodos.bind(proveedorController));
router.get('/obtenerUno/:id', proveedorController.obtenerUno.bind(proveedorController));
router.put('/actualizar/:id', proveedorController.actualizar.bind(proveedorController));
router.delete('/eliminar/:id', proveedorController.eliminar.bind(proveedorController));

module.exports = router;
