const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // 1. hash password
        const hash = await bcrypt.hash(password, 10);

        // 2. create user
        const [result] = await db.query(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hash]
        );

        const userId = result.insertId;

        // 3. CREATE WALLET (FONDAMENTALE)
        await db.query(
            "INSERT INTO user_wallets (user_id, balance, locked_balance) VALUES (?, 0, 0)",
            [userId]
        );

        // 4. token
        const token = jwt.sign(
            { userId },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: "User created with wallet",
            userId,
            token
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. trova utente
        const [users] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = users[0];

        // 2. verifica password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Wrong password" });
        }

        // 3. crea token
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
        res.status(500).json({ error: err.message });
    }
};