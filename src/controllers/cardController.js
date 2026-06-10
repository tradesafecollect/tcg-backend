const db = require('../config/database');

/*
|--------------------------------------------------------------------------
| INVENTARIO UTENTE
|--------------------------------------------------------------------------
*/

exports.getMyCards = async (req, res) => {

    try {

        const userId = req.userId;

        const result = await db.query(`
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
                c.attack,
                c.defense,
                c.speed,
                c.hp,
                c.image_url

            FROM card_instances ci

            JOIN cards c
                ON ci.card_id = c.id

            WHERE ci.owner_user_id = $1
        `, [userId]);

        res.json(result.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| COLLEZIONE UTENTE
|--------------------------------------------------------------------------
*/

exports.getMyCollectionCards = async (req, res) => {

    try {

        const userId = req.userId;

        const result = await db.query(`
            SELECT
                uc.id AS user_card_id,
                uc.obtained_at,
                uc.burned,
                uc.locked_in_tournament,

                c.*

            FROM user_cards uc

            JOIN cards c
                ON uc.card_id = c.id

            WHERE uc.user_id = $1

            ORDER BY uc.obtained_at DESC
        `, [userId]);

        res.json(result.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| DETTAGLIO CARTA
|--------------------------------------------------------------------------
*/

exports.getCard = async (req, res) => {

    try {

        const { id } = req.params;

        const result = await db.query(`
            SELECT *
            FROM cards
            WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {

            return res.status(404).json({
                error: 'Carta non trovata'
            });
        }

        res.json(result.rows[0]);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| STORICO CARTA
|--------------------------------------------------------------------------
*/

exports.getCardHistory = async (req, res) => {

    try {

        const { cardId } = req.params;

        const result = await db.query(`
            SELECT *
            FROM card_history
            WHERE card_id = $1
            ORDER BY created_at DESC
        `, [cardId]);

        res.json(result.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| CREA CARTA
|--------------------------------------------------------------------------
*/

exports.createCard = async (req, res) => {

    try {

        const {
            name,
            set_name,
            rarity,
            element,
            dms,
            image_url,
            attack,
            defense,
            hp,
            speed,
            season,
            fusion_level,
            serial_number,
            population,
            dms_border_grade,
            dms_surface_grade,
            dms_corner_grade,
            dms_total_grading
        } = req.body;

        const result = await db.query(`
            INSERT INTO cards (

                name,
                set_name,
                rarity,
                element,
                dms,
                image_url,
                attack,
                defense,
                hp,
                speed,
                season,
                fusion_level,
                serial_number,
                population,
                dms_border_grade,
                dms_surface_grade,
                dms_corner_grade,
                dms_total_grading

            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,
                $10,$11,$12,$13,$14,$15,$16,
                $17,$18
            )
            RETURNING *
        `, [
            name,
            set_name,
            rarity,
            element,
            dms,
            image_url,
            attack,
            defense,
            hp,
            speed,
            season,
            fusion_level,
            serial_number,
            population,
            dms_border_grade,
            dms_surface_grade,
            dms_corner_grade,
            dms_total_grading
        ]);

        res.status(201).json(result.rows[0]);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| CARTE NON ASSEGNATE
|--------------------------------------------------------------------------
*/

exports.getUnassignedCards = async (req, res) => {

    try {

        const result = await db.query(`
            SELECT c.*
            FROM cards c

            LEFT JOIN user_cards uc
                ON c.id = uc.card_id

            WHERE uc.id IS NULL

            ORDER BY c.created_at DESC
        `);

        res.json(result.rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| ASSEGNA CARTA AD UTENTE
|--------------------------------------------------------------------------
*/

exports.assignCardToUser = async (req, res) => {

    try {

        const {
            user_id,
            card_id
        } = req.body;

        await db.query(`
            INSERT INTO user_cards (
                user_id,
                card_id
            )
            VALUES ($1, $2)
        `, [
            user_id,
            card_id
        ]);

        res.json({
            message: 'Carta assegnata con successo'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};