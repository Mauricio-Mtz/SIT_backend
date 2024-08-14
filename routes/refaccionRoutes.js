const express = require('express');
const router = express.Router();
const refaccionController = require('../controllers/refaccionController');

router.post('/registrar', refaccionController.registrar.bind(refaccionController));
router.get('/obtenerTodas/:sucursal', refaccionController.obtenerTodas.bind(refaccionController));
router.get('/obtenerTodasParaPaquetes', refaccionController.obtenerTodasS.bind(refaccionController));
router.get('/obtenerUna/:id', refaccionController.obtenerUna.bind(refaccionController));
router.put('/actualizar/:id', refaccionController.actualizar.bind(refaccionController));
router.delete('/eliminar/:id', refaccionController.eliminar.bind(refaccionController));
router.post('/validarStock', refaccionController.validarStock.bind(refaccionController));

module.exports = router;
