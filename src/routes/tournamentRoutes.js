const express = require('express');
const router = express.Router();

const {
    createTournament
} = require('../controllers/tournamentController');

router.post(
    '/tournaments',
    createTournament
);

module.exports = router;