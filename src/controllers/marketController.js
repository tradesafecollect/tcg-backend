const db = require('../config/database');

exports.createListing = async (req, res) => {
    try {
        const userId = req.userId;
	const { cardInstanceId, price } = req.body;

        // 1. verifica proprietà
        const [cards] = await db.query(
            "SELECT * FROM card_instances WHERE id = ? AND owner_user_id = ?",
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
            "UPDATE card_instances SET is_locked = TRUE WHERE id = ?",
            [cardInstanceId]
        );

        // 3. crea listing
        await db.query(
            `INSERT INTO marketplace_listings 
            (seller_user_id, card_instance_id, price)
            VALUES (?, ?, ?)`,
            [userId, cardInstanceId, price]
        );

        res.json({ message: "Card listed" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getListings = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT ml.*, c.name, c.rarity, c.card_type
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
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const buyerId = req.userId;
        const { listingId } = req.body;

        // 1. prendi listing
        const [listings] = await conn.query(
            "SELECT * FROM marketplace_listings WHERE id = ? AND status = 'active' FOR UPDATE",
            [listingId]
	);

        if (listings.length === 0) {
            throw new Error("Listing not found");
        }

        const listing = listings[0];

        // dati carta
        const [cardData] = await conn.query(
            "SELECT card_id, level FROM card_instances WHERE id = ?",
            [listing.card_instance_id]
        );

        const card = cardData[0];

        // self-buy check
        if (listing.seller_user_id === buyerId) {
            throw new Error("Cannot buy your own card");
        }

        // wallet
        const [wallet] = await conn.query(
            "SELECT balance FROM user_wallets WHERE user_id = ?",
            [buyerId]
        );

        if (!wallet[0] || wallet[0].balance < listing.price) {
            throw new Error("Not enough money");
        }

        // 💰 pagamento
        await conn.query(
            "UPDATE user_wallets SET balance = balance - ? WHERE user_id = ?",
            [listing.price, buyerId]
        );

        await conn.query(
            "UPDATE user_wallets SET balance = balance + ? WHERE user_id = ?",
            [listing.price, listing.seller_user_id]
        );

        // 🧾 wallet log
        await conn.query(
            `INSERT INTO wallet_transactions
            (wallet_id, transaction_type, amount, description)
            VALUES (
                (SELECT id FROM user_wallets WHERE user_id = ?),
                'purchase',
                ?,
                ?
            )`,
            [buyerId, listing.price, `Bought card ${listing.card_instance_id}`]
        );

        await conn.query(
            `INSERT INTO wallet_transactions
            (wallet_id, transaction_type, amount, description)
            VALUES (
                (SELECT id FROM user_wallets WHERE user_id = ?),
                'sale',
                ?,
                ?
            )`,
            [listing.seller_user_id, listing.price, `Sold card ${listing.card_instance_id}`]
        );

        // 📊 storico carta
        await conn.query(
            `INSERT INTO card_sales_history 
            (card_id, card_instance_id, seller_user_id, buyer_user_id, price, card_level)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                card.card_id,
                listing.card_instance_id,
                listing.seller_user_id,
                buyerId,
                listing.price,
                card.level
            ]
        );

        // 🎴 trasferimento carta
        await conn.query(
            "UPDATE card_instances SET owner_user_id = ?, is_locked = FALSE WHERE id = ?",
            [buyerId, listing.card_instance_id]
        );

        // 🔒 chiudi listing
        await conn.query(
            "UPDATE marketplace_listings SET status = 'sold' WHERE id = ?",
            [listingId]
        );

        await conn.commit();

        res.json({ message: "Card purchased!" });

    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: err.message });
    } finally {
        conn.release();
    }
};