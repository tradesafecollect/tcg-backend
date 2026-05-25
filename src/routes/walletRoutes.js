const express = require('express');
const router = express.Router();

const walletController = require('../controllers/walletController');

// 🔐 IMPORTA MIDDLEWARE
const authMiddleware = require('../middleware/authMiddleware');

// ======================
// ROUTES PROTETTE
// ======================

// saldo wallet
router.get('/balance', authMiddleware, walletController.getBalance);

// aggiungi soldi (admin/test)
router.post('/add', walletController.addMoney);

// sottrai soldi
router.post('/deduct', walletController.deductMoney);

// trasferimento
router.post('/transfer', walletController.transferMoney);

module.exports = router;