console.log("RESEND:", process.env.RESEND_API_KEY);
console.log("ADMIN:", process.env.ADMIN_EMAIL);

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: '*'
}));
app.use(express.json());

// ======================
// ROUTES
// ======================
const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const marketRoutes = require('./routes/marketRoutes');
const cardRoutes = require('./routes/cardRoutes');
const betaRoutes = require('./routes/betaRoutes');


app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/market', marketRoutes);
app.use('/api', cardRoutes);
app.use('/api', betaRoutes);

// ======================
// TEST ROUTE
// ======================
app.get('/', (req, res) => {
    res.json({ message: 'TCG Backend Running' });
});

// ======================
// DB CONNECTION TEST
// ======================
const db = require('./config/database');

async function testDB() {
    try {
        const res = await db.query('SELECT NOW()');
        console.log("DB connesso:", res.rows[0]);
    } catch (err) {
        console.error("Errore DB:", err.message);
    }
}

testDB();

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
