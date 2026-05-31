const express = require('express');
const router = express.Router();

const { createBetaRequest } = require('../controllers/betaController');

router.post('/beta-request', createBetaRequest);

module.exports = router;