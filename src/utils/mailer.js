const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendBetaNotification = async (data) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: 'Nuova richiesta beta',
        html: `
            <h2>Nuova richiesta beta</h2>
            <p><b>Username:</b> ${data.username}</p>
            <p><b>Email:</b> ${data.email}</p>
            <p><b>Nome:</b> ${data.nome} ${data.cognome}</p>
            <p><b>Città:</b> ${data.citta}</p>
            <p><b>Anni collezionismo:</b> ${data.anni_collezionismo}</p>
        `
    });
};