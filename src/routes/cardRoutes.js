const express = require('express');
const router = express.Router();

const cardController = require('../controllers/cardController');
const authMiddleware = require('../middleware/authMiddleware');
const { getCard } = require('../controllers/cardController');

const {
    createCard
} = require('../controllers/cardController');

// 🎴 inventory utente
router.get('/my-cards', authMiddleware, cardController.getMyCards);
router.get('/my-collection', authMiddleware, cardController.getMyCollectionCards);

router.get('/history/:cardId', cardController.getCardHistory);

router.get("/cards/:id", getCard);

router.post(
    '/cards',
    createCard
);

module.exports = router;