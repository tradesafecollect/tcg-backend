const db = require('../config/database');

/*
|--------------------------------------------------------------------------
| CREA LISTING
|--------------------------------------------------------------------------
*/

exports.createListing = async (req, res) => {

    try {

        const userId = req.userId;

        const {
            cardInstanceId,
            price
        } = req.body;

        // Verifica proprietà della carta
        const { rows: cards } = await db.query(
            `
            SELECT *
            FROM card_instances
            WHERE id = $1
            AND owner_user_id = $2
            `,
            [cardInstanceId, userId]
        );

        if (cards.length === 0) {
            return res.status(403).json({
                message: "Non possiedi questa carta"
            });
        }

        // Verifica che non sia già in vendita
        if (cards[0].is_locked) {
            return res.status(400).json({
                message: "Carta già in vendita"
            });
        }

        // Blocca la carta
        await db.query(
            `
            UPDATE card_instances
            SET is_locked = TRUE
            WHERE id = $1
            `,
            [cardInstanceId]
        );

        // Crea listing
        await db.query(
            `
            INSERT INTO marketplace_listings (
                seller_user_id,
                card_instance_id,
                price,
                status
            )
            VALUES ($1, $2, $3, 'active')
            `,
            [
                userId,
                cardInstanceId,
                price
            ]
        );

        res.json({
            message: "Carta messa in vendita"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| LISTA MARKETPLACE
|--------------------------------------------------------------------------
*/

exports.getListings = async (req, res) => {

    try {

        const { rows } = await db.query(`
            SELECT
                ml.id,
                ml.price,
                ml.status,
                ml.created_at,

                ci.id AS card_instance_id,
                ci.level,

                c.id AS card_id,
                c.name,
                c.rarity,
                c.image_url,
                c.element

            FROM marketplace_listings ml

            JOIN card_instances ci
                ON ml.card_instance_id = ci.id

            JOIN cards c
                ON ci.card_id = c.id

            WHERE ml.status = 'active'

            ORDER BY ml.created_at DESC
        `);

        res.json(rows);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};


/*
|--------------------------------------------------------------------------
| ACQUISTA CARTA
|--------------------------------------------------------------------------
*/

exports.buyCard = async (req, res) => {

    try {

        const buyerId = req.userId;

        const { listingId } = req.body;

        // Recupera listing
        const { rows: listings } = await db.query(
            `
            SELECT *
            FROM marketplace_listings
            WHERE id = $1
            AND status = 'active'
            `,
            [listingId]
        );

        if (listings.length === 0) {
            return res.status(404).json({
                message: "Listing non trovato"
            });
        }

        const listing = listings[0];

        // Non comprare le proprie carte
        if (listing.seller_user_id === buyerId) {
            return res.status(400).json({
                message: "Non puoi comprare le tue carte"
            });
        }

        // Recupera dati carta
        const { rows: cardData } = await db.query(
            `
            SELECT
                card_id,
                level
            FROM card_instances
            WHERE id = $1
            `,
            [listing.card_instance_id]
        );

        if (cardData.length === 0) {
            return res.status(404).json({
                message: "Carta non trovata"
            });
        }

        const card = cardData[0];

        // Wallet acquirente
        const { rows: wallets } = await db.query(
            `
            SELECT *
            FROM user_wallets
            WHERE user_id = $1
            `,
            [buyerId]
        );

        if (wallets.length === 0) {
            return res.status(404).json({
                message: "Wallet non trovato"
            });
        }

        const wallet = wallets[0];

        if (parseFloat(wallet.balance) < parseFloat(listing.price)) {
            return res.status(400).json({
                message: "Saldo insufficiente"
            });
        }

        // Transazione
        await db.query(
            `
            UPDATE user_wallets
            SET balance = balance - $1
            WHERE user_id = $2
            `,
            [listing.price, buyerId]
        );

        await db.query(
            `
            UPDATE user_wallets
            SET balance = balance + $1
            WHERE user_id = $2
            `,
            [listing.price, listing.seller_user_id]
        );

        // Trasferisci proprietà della carta
        await db.query(
            `
            UPDATE card_instances
            SET
                owner_user_id = $1,
                is_locked = FALSE
            WHERE id = $2
            `,
            [buyerId, listing.card_instance_id]
        );

        // Chiudi listing
        await db.query(
            `
            UPDATE marketplace_listings
            SET status = 'sold'
            WHERE id = $1
            `,
            [listingId]
        );

        // Storico vendite
        await db.query(
            `
            INSERT INTO card_sales_history (
                card_id,
                card_instance_id,
                seller_user_id,
                buyer_user_id,
                price,
                card_level
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [
                card.card_id,
                listing.card_instance_id,
                listing.seller_user_id,
                buyerId,
                listing.price,
                card.level
            ]
        );

        res.json({
            message: "Carta acquistata con successo"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};