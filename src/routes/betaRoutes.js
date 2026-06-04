const express = require('express');
const router = express.Router();

const {
    createBetaRequest,
    approveBetaRequest
} = require('../controllers/betaController');

router.post('/beta-request', createBetaRequest);

router.post(
    '/beta/approve/:id',
    approveBetaRequest
);

module.exports = router;