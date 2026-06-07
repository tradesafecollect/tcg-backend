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

exports.createCard = async (req, res) => {

    try {

        const {
            name,
            set_name,
            rarity,
            attack,
            defense,
            hp,
            image_url,
            speed,
            season,
            fusion_level,
            serial_number,
            dms_border_grade,
            dms_surface_grade,
            dms_corner_grade,
            dms_total_grading,
            population,
            dms,
            element
        } = req.body;

        await db.query(`
            INSERT INTO cards (
                name,
                set_name,
                rarity,
                attack,
                defense,
                hp,
                image_url,
                speed,
                season,
                fusion_level,
                serial_number,
                dms_border_grade,
                dms_surface_grade,
                dms_corner_grade,
                dms_total_grading,
                population,
                dms,
                element
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,
                $10,$11,$12,$13,$14,$15,
                $16,$17,$18
            )
        `, [
            name,
            set_name,
            rarity,
            attack,
            defense,
            hp,
            image_url,
            speed,
            season,
            fusion_level,
            serial_number,
            dms_border_grade,
            dms_surface_grade,
            dms_corner_grade,
            dms_total_grading,
            population,
            dms || false,
            element
        ]);

        res.json({
            message: "Carta creata con successo"
        });

    } catch (err) {

        console.error("❌ ERRORE CREATE CARD:", err);

        res.status(500).json({
            error: err.message
        });
    }
};