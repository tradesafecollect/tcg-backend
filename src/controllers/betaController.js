const db = require('../config/database');
const bcrypt = require('bcrypt');

const {
    sendBetaNotification,
    sendUserConfirmation
} = require('../utils/mailer');


// =====================================
// CREA RICHIESTA BETA
// =====================================

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

        const hashedPassword =
            await bcrypt.hash(password, 10);

        await db.query(`
            INSERT INTO beta_requests
            (
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
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
            )
        `,[
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

        res.json({
            message: 'Richiesta inviata'
        });

    } catch(err){

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};


// =====================================
// PENDING
// =====================================

exports.getPendingRequests = async (req, res) => {

    try {

        const requests = await db.query(`
            SELECT *
            FROM beta_requests
            WHERE status = 'pending'
            ORDER BY created_at DESC
        `);

        res.json(requests.rows);

    } catch(err){

        res.status(500).json({
            error: err.message
        });
    }
};


// =====================================
// WAITING LIST
// =====================================

exports.getAcceptedRequests = async (req, res) => {

    try {

        const requests = await db.query(`
            SELECT *
            FROM beta_requests
            WHERE status = 'accepted'
            ORDER BY waitlist_position ASC
        `);

        res.json(requests.rows);

    } catch(err){

        res.status(500).json({
            error: err.message
        });
    }
};


// =====================================
// INVITED
// =====================================

exports.getInvitedRequests = async (req, res) => {

    try {

        const requests = await db.query(`
            SELECT *
            FROM beta_requests
            WHERE status = 'invited'
            ORDER BY approved_at DESC
        `);

        res.json(requests.rows);

    } catch(err){

        res.status(500).json({
            error: err.message
        });
    }
};


// =====================================
// REJECTED
// =====================================

exports.getRejectedRequests = async (req, res) => {

    try {

        const requests = await db.query(`
            SELECT *
            FROM beta_requests
            WHERE status = 'rejected'
            ORDER BY created_at DESC
        `);

        res.json(requests.rows);

    } catch(err){

        res.status(500).json({
            error: err.message
        });
    }
};


// =====================================
// ACCETTA IN WAITING LIST
// =====================================

exports.acceptToWaitlist = async (req, res) => {

    try {

        const { id } = req.params;

        const request = await db.query(`
            SELECT *
            FROM beta_requests
            WHERE id = $1
        `,[id]);

        if(request.rows.length === 0){

            return res.status(404).json({
                error: 'Richiesta non trovata'
            });
        }

        const positionResult = await db.query(`
            SELECT COUNT(*)
            FROM beta_requests
            WHERE status = 'accepted'
        `);

        const position =
            parseInt(positionResult.rows[0].count) + 1;

        await db.query(`
            UPDATE beta_requests
            SET
                status = 'accepted',
                waitlist_position = $1
            WHERE id = $2
        `,[position,id]);

        res.json({
            message: 'Utente inserito in waiting list',
            position
        });

    } catch(err){

        res.status(500).json({
            error: err.message
        });
    }
};


// =====================================
// INVITA ALLA BETA
// =====================================

exports.inviteUser = async (req, res) => {

    try {

        const { id } = req.params;

        const request = await db.query(`
            SELECT *
            FROM beta_requests
            WHERE id = $1
        `,[id]);

        if(request.rows.length === 0){

            return res.status(404).json({
                error: 'Utente non trovato'
            });
        }

        const user = request.rows[0];

        const exists = await db.query(`
            SELECT id
            FROM users
            WHERE email = $1
        `,[user.email]);

        if(exists.rows.length === 0){

            await db.query(`
                INSERT INTO users
                (
                    username,
                    email,
                    password,
                    role
                )
                VALUES
                (
                    $1,$2,$3,$4
                )
            `,[
                user.username,
                user.email,
                user.password,
                'user'
            ]);
        }

        await db.query(`
            UPDATE beta_requests
            SET
                status = 'invited',
                approved_at = NOW()
            WHERE id = $1
        `,[id]);

        res.json({
            message: 'Utente invitato'
        });

    } catch(err){

        res.status(500).json({
            error: err.message
        });
    }
};


// =====================================
// RIFIUTA
// =====================================

exports.rejectBetaRequest = async (req, res) => {

    try {

        const { id } = req.params;

        await db.query(`
            UPDATE beta_requests
            SET status = 'rejected'
            WHERE id = $1
        `,[id]);

        res.json({
            message: 'Richiesta rifiutata'
        });

    } catch(err){

        res.status(500).json({
            error: err.message
        });
    }
};