const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');

router.post('/buscarUsuario', loginController.login.bind(loginController));

module.exports = router;
