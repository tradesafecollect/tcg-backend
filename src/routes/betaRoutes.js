const express = require('express');
const router = express.Router();

const {
    createBetaRequest,
    approveBetaRequest
    getBetaRequests
} = require('../controllers/betaController');

router.post('/beta-request', createBetaRequest);

router.post(
    '/beta/approve/:id',
    approveBetaRequest

router.get(
    '/beta/pending',
    getBetaRequests

);

module.exports = router;