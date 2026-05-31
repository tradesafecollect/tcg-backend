const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendBetaNotification = async (data) => {
    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev', // default funzionante
            to: process.env.ADMIN_EMAIL,
            subject: 'Nuova richiesta beta',
            html: `
                <h2>Nuova richiesta beta</h2>
                <p><b>Username:</b> ${data.username}</p>
                <p><b>Email:</b> ${data.email}</p>
                <p><b>Nome:</b> ${data.nome} ${data.cognome}</p>
                <p><b>Città:</b> ${data.citta}</p>
                <p><b>Anni:</b> ${data.anni_collezionismo}</p>
            `
        });

        console.log("✅ EMAIL INVIATA");

    } catch (err) {
        console.error("❌ ERRORE RESEND:", err);
    }
};