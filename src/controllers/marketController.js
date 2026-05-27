const db = require('../config/database');

exports.createListing = async (req, res) => {
    try {
        const userId = req.userId;
        const { cardInstanceId, price } = req.body;

        // 1. verifica proprietà
        const { rows: cards } = await db.query(
            "SELECT * FROM card_instances WHERE id = $1 AND owner_user_id = $2",
            [cardInstanceId, userId]
        );

        if (cards.length === 0) {
            return res.status(403).json({ message: "Not owner of card" });
        }

        if (cards[0].is_locked) {
            return res.status(400).json({ message: "Card already listed" });
        }

        // 2. blocca carta
        await db.query(
            "UPDATE card_instances SET is_locked = TRUE WHERE id = $1",
            [cardInstanceId]
        );

        // 3. crea listing
        await db.query(
            `INSERT INTO marketplace_listings 
            (seller_user_id, card_instance_id, price)
            VALUES ($1, $2, $3)`,
            [userId, cardInstanceId, price]
        );

        res.json({ message: "Card listed" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getListings = async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT ml.*, c.name, c.rarity
            FROM marketplace_listings ml
            JOIN card_instances ci ON ml.card_instance_id = ci.id
            JOIN cards c ON ci.card_id = c.id
            WHERE ml.status = 'active'
        `);

        res.json(rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.buyCard = async (req, res) => {
    try {
        const buyerId = req.userId;
        const { listingId } = req.body;

        // 1. prendi listing
        const { rows: listings } = await db.query(
            "SELECT * FROM marketplace_listings WHERE id = $1 AND status = 'active'",
            [listingId]
        );

        if (listings.length === 0) {
            return res.status(404).json({ message: "Listing not found" });
        }

        const listing = listings[0];

        // 2. dati carta
        const { rows: cardData } = await db.query(
            "SELECT card_id, level FROM card_instances WHERE id = $1",
            [listing.card_instance_id]
        );

        const card = cardData[0];

        // non comprare propria carta
        if (listing.seller_user_id === buyerId) {
            return res.status(400).json({ message: "Cannot buy your own card" });
        }

        // 3. wallet buyer
        const { rows: wallet } = await db.query(
            "SELECT balance FROM user_wallets WHERE user_id = $1",
            [buyerId]
        );

        if (!wallet[0]) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        if (wallet[0].balance < listing.price) {
            return res.status(400).json({ message: "Not enough money" });
        }

        // 4. paga
        await db.query(
            "UPDATE user_wallets SET balance = balance - $1 WHERE user_id = $2",
            [listing.price, buyerId]
        );

        await db.query(
            "UPDATE user_wallets SET balance = balance + $1 WHERE user_id = $2",
            [listing.price, listing.seller_user_id]
        );

        // WALLET TRANSACTIONS

        await db.query(
            `INSERT INTO wallet_transactions
            (wallet_id, transaction_type, amount, balance_before, balance_after, description)
            VALUES (
                (SELECT id FROM user_wallets WHERE user_id = $1),
                'purchase',
                $2,
                0,
                0,
                $3
            )`,
            [
                buyerId,
                listing.price,
                `Bought card ${listing.card_instance_id}`
            ]
        );

        await db.query(
            `INSERT INTO wallet_transactions
            (wallet_id, transaction_type, amount, balance_before, balance_after, description)
            VALUES (
                (SELECT id FROM user_wallets WHERE user_id = $1),
                'sale',
                $2,
                0,
                0,
                $3
            )`,
            [
                listing.seller_user_id,
                listing.price,
                `Sold card ${listing.card_instance_id}`
            ]
        );

        // storico carta
        await db.query(
            `INSERT INTO card_sales_history 
            (card_id, card_instance_id, seller_user_id, buyer_user_id, price, card_level)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                card.card_id,
                listing.card_instance_id,
                listing.seller_user_id,
                buyerId,
                listing.price,
                card.level
            ]
        );

        // trasferisci carta
        await db.query(
            "UPDATE card_instances SET owner_user_id = $1, is_locked = FALSE WHERE id = $2",
            [buyerId, listing.card_instance_id]
        );

        // chiudi listing
        await db.query(
            "UPDATE marketplace_listings SET status = 'sold' WHERE id = $1",
            [listingId]
        );

        res.json({ message: "Card purchased!" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};