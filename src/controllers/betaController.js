const db = require('../config/database');
const bcrypt = require('bcrypt');
const { 
	sendBetaNotification,
    	sendUserConfirmation 
} = require('../utils/mailer');

exports.createBetaRequest = async (req, res) => {
    console.log("🔥 RICHIESTA ARRIVATA AL BACKEND");

    try {
        const {
            username,
            email,
            password,
            nome,
            cognome,
            indirizzo1,
            indirizzo2,
            citta,
            cap,
            referral,
            anni_collezionismo
        } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(`
            INSERT INTO beta_requests 
            (username, email, password, nome, cognome, indirizzo1, indirizzo2, citta, cap, referral, anni_collezionismo)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `, [
            username,
            email,
            hashedPassword,
            nome,
            cognome,
            indirizzo1,
            indirizzo2,
            citta,
            cap,
            referral,
            anni_collezionismo
        ]);

        console.log("📩 sto per inviare email...");

        await sendBetaNotification({
                username,
    		email,
    		nome,
    		cognome,
    		indirizzo1,
    		indirizzo2,
    		citta,
    		cap,
   		referral,
   		anni_collezionismo
        });

	await sendUserConfirmation(
    		email,
    		username
	);
        
	console.log("✅ EMAIL INVIATA");

        res.json({ message: "Request salvata" });

    } catch (err) {
        console.error("❌ ERRORE BACKEND:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.approveBetaRequest = async (req, res) => {
    try {

        const { id } = req.params;

        const request = await db.query(
            `SELECT * FROM beta_requests WHERE id = $1`,
            [id]
        );

        if (request.rows.length === 0) {
            return res.status(404).json({
                error: "Richiesta non trovata"
            });
        }

        const user = request.rows[0];

        // Controlla se esiste già
        const existingUser = await db.query(
            `SELECT id FROM users WHERE email = $1`,
            [user.email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                error: "Utente già presente"
            });
        }

        // Crea utente
        await db.query(`
            INSERT INTO users
            (
                username,
                email,
                password,
                role
            )
            VALUES ($1,$2,$3,$4)
        `, [
            user.username,
            user.email,
            user.password,
            'user'
        ]);

        // Aggiorna richiesta
        await db.query(`
            UPDATE beta_requests
            SET
                status = 'approved',
                approved_at = NOW()
            WHERE id = $1
        `, [id]);

        res.json({
            message: "Utente approvato con successo"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};

exports.getBetaRequests = async (req, res) => {
    try {

        const requests = await db.query(`
            SELECT *
            FROM beta_requests
            WHERE status = 'pending'
            ORDER BY created_at DESC
        `);

        res.json(requests.rows);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};