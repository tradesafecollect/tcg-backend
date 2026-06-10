const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {

    const client = await db.connect();

    try {

        const {
            username,
            email,
            password
        } = req.body;

        // Controlla se utente esiste già
        const existingUser = await client.query(`
            SELECT id
            FROM users
            WHERE email = $1
            OR username = $2
        `, [
            email,
            username
        ]);

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                message: "Email o username già utilizzati"
            });
        }

        // Hash password
        const hash = await bcrypt.hash(password, 10);

        await client.query('BEGIN');

        // Crea utente
        const userResult = await client.query(`
            INSERT INTO users (
                username,
                email,
                password
            )
            VALUES ($1, $2, $3)
            RETURNING id
        `, [
            username,
            email,
            hash
        ]);

        const userId = userResult.rows[0].id;

        // Crea wallet
        await client.query(`
            INSERT INTO user_wallets (
                user_id,
                balance,
                locked_balance
            )
            VALUES ($1, 0, 0)
        `, [
            userId
        ]);

        await client.query('COMMIT');

        // Genera JWT
        const token = jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: "User created with wallet",
            userId,
            token
        });

    } catch (err) {

        await client.query('ROLLBACK');

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    } finally {

        client.release();
    }
};

exports.login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        // Trova utente
        const result = await db.query(`
            SELECT *
            FROM users
            WHERE email = $1
        `, [
            email
        ]);

        if (result.rows.length === 0) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        const user = result.rows[0];

        // Verifica password
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).json({
                message: "Wrong password"
            });
        }

        // Genera JWT
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: "Login successful",
            token,
            userId: user.id
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};