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