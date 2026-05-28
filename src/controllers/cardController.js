const db = require('../config/database');

exports.getMyCards = async (req, res) => {
    try {
        const userId = req.userId; // 🔥 dal token

        const [cards] = await db.query(`
            SELECT 
                ci.id,
                ci.serial_code,
                ci.level,
                ci.xp,
                ci.attack_bonus,
                ci.defense_bonus,
                ci.speed_bonus,
                ci.hp_bonus,
                ci.is_locked,

                c.name,
                c.rarity,
                c.base_attack,
                c.base_defense,
                c.base_speed,
                c.base_hp

            FROM card_instances ci
            JOIN cards c ON ci.card_id = c.id
            WHERE ci.owner_user_id = ?
	    AND c.card_type = 'dms'
        `, [userId]);

        res.json(cards);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCardHistory = async (req, res) => {
    try {
        const { cardId } = req.params;

        const [rows] = await db.query(`
            SELECT 
                price,
                card_level AS level,
                created_at AS date
            FROM card_sales_history
            WHERE card_id = ?
            ORDER BY created_at ASC
        `, [cardId]);

        res.json(rows);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMyCollectionCards = async (req, res) => {
    try {
        const userId = req.userId;

        const [cards] = await db.query(`
            SELECT ci.*, c.name, c.rarity
            FROM card_instances ci
            JOIN cards c ON ci.card_id = c.id
            WHERE ci.owner_user_id = ?
            AND c.card_type = 'collection'
        `, [userId]);

        res.json(cards);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getCard = async (req, res) => {
    try {
        const { id } = req.params;

        const { rows } = await db.query(`
            SELECT 
                c.*,
                (
                    SELECT price 
                    FROM card_sales_history 
                    WHERE card_id = c.id 
                    ORDER BY created_at DESC 
                    LIMIT 1
                ) as last_price
            FROM cards c
            WHERE c.id = $1
        `, [id]);

        res.json(rows[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};