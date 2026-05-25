const db = require('../config/database');

exports.getBalance = async (req, res) => {
    try {
        const { userId } = req.userId;

        const [rows] = await db.query(
            "SELECT balance, locked_balance FROM user_wallets WHERE user_id = ?",
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        res.json(rows[0]);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addMoney = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        await db.query(
            "UPDATE user_wallets SET balance = balance + ? WHERE user_id = ?",
            [amount, userId]
        );

        res.json({ message: "Money added" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deductMoney = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        const [rows] = await db.query(
            "SELECT balance FROM user_wallets WHERE user_id = ?",
            [userId]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        const balance = rows[0].balance;

        if (balance < amount) {
            return res.status(400).json({ message: "Insufficient funds" });
        }

        await db.query(
            "UPDATE user_wallets SET balance = balance - ? WHERE user_id = ?",
            [amount, userId]
        );

        res.json({ message: "Money deducted" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.transferMoney = async (req, res) => {
    try {
        const { fromUserId, toUserId, amount } = req.body;

        const [senderRows] = await db.query(
            "SELECT balance FROM user_wallets WHERE user_id = ?",
            [fromUserId]
        );

        if (!senderRows || senderRows.length === 0) {
            return res.status(404).json({ message: "Sender wallet not found" });
        }

        const senderBalance = senderRows[0].balance;

        if (senderBalance < amount) {
            return res.status(400).json({ message: "Insufficient funds" });
        }

        await db.query(
            "UPDATE user_wallets SET balance = balance - ? WHERE user_id = ?",
            [amount, fromUserId]
        );

        await db.query(
            "UPDATE user_wallets SET balance = balance + ? WHERE user_id = ?",
            [amount, toUserId]
        );

        res.json({ message: "Transfer completed" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};