const db = require('../config/database');
const bcrypt = require('bcrypt');

exports.createBetaRequest = async (req, res) => {
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

	await sendBetaNotification({
    		username,
    		email,
    		nome,
    		cognome,
    		citta,
    		anni_collezionismo
	});

        res.json({ message: "Request salvata" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};