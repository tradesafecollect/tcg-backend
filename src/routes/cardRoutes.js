const express = require('express');
const router = express.Router();

const cardController = require('../controllers/cardController');
const authMiddleware = require('../middleware/authMiddleware');

// 🎴 inventory utente
router.get('/my-cards', authMiddleware, cardController.getMyCards);
router.get('/my-collection', authMiddleware, cardController.getMyCollectionCards);

router.get('/history/:cardId', cardController.getCardHistory);

module.exports = router;