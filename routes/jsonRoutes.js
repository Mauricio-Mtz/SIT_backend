const express = require('express');
const router = express.Router();
const jsonController = require('../controllers/jsonController');

router.get('/obtenerPaquetesJson', jsonController.obtenerPaquetesJson.bind(jsonController));
router.post('/modificarPaquetesJson', jsonController.modificarPaquetesJson.bind(jsonController));

module.exports = router;
