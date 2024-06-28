const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');

router.post('/registrar', empleadoController.crearEmpleado.bind(empleadoController));
router.get('/obtenerTodos', empleadoController.obtenerEmpleados.bind(empleadoController));
router.get('/obtenerUno/:id', empleadoController.obtenerEmpleado.bind(empleadoController));
router.put('/actualizar/:id', empleadoController.actualizarEmpleado.bind(empleadoController));
router.delete('/eliminar/:id', empleadoController.eliminarEmpleado.bind(empleadoController));

module.exports = router;
