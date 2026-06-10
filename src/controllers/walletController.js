const db = require('../config/database');

exports.getBalance = async (req, res) => {

    try {

        const userId = req.userId;

        const result = await db.query(`
            SELECT
                balance,
                locked_balance
            FROM user_wallets
            WHERE user_id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Wallet not found"
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

exports.addMoney = async (req, res) => {

    try {

        const {
            userId,
            amount
        } = req.body;

        await db.query(`
            UPDATE user_wallets
            SET balance = balance + $1
            WHERE user_id = $2
        `, [
            amount,
            userId
        ]);

        res.json({
            message: "Money added"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};

exports.deductMoney = async (req, res) => {

    try {

        const {
            userId,
            amount
        } = req.body;

        const result = await db.query(`
            SELECT balance
            FROM user_wallets
            WHERE user_id = $1
        `, [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Wallet not found"
            });
        }

        const balance =
            parseFloat(result.rows[0].balance);

        if (balance < amount) {
            return res.status(400).json({
                message: "Insufficient funds"
            });
        }

        await db.query(`
            UPDATE user_wallets
            SET balance = balance - $1
            WHERE user_id = $2
        `, [
            amount,
            userId
        ]);

        res.json({
            message: "Money deducted"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};

exports.transferMoney = async (req, res) => {

    try {

        const {
            fromUserId,
            toUserId,
            amount
        } = req.body;

        const senderResult = await db.query(`
            SELECT balance
            FROM user_wallets
            WHERE user_id = $1
        `, [fromUserId]);

        if (senderResult.rows.length === 0) {
            return res.status(404).json({
                message: "Sender wallet not found"
            });
        }

        const senderBalance =
            parseFloat(senderResult.rows[0].balance);

        if (senderBalance < amount) {
            return res.status(400).json({
                message: "Insufficient funds"
            });
        }

        await db.query(`
            UPDATE user_wallets
            SET balance = balance - $1
            WHERE user_id = $2
        `, [
            amount,
            fromUserId
        ]);

        await db.query(`
            UPDATE user_wallets
            SET balance = balance + $1
            WHERE user_id = $2
        `, [
            amount,
            toUserId
        ]);

        res.json({
            message: "Transfer completed"
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};