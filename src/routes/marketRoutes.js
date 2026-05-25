const express = require('express');
const router = express.Router();

const marketController = require('../controllers/marketController');

// 🔐 middleware
const authMiddleware = require('../middleware/authMiddleware');

// ======================
// ROUTES PROTETTE
// ======================

// crea listing
router.post('/list', authMiddleware, marketController.createListing);

// lista marketplace (può anche essere pubblica)
router.get('/all', marketController.getListings);

// compra carta
router.post('/buy', authMiddleware, marketController.buyCard);

module.exports = router;