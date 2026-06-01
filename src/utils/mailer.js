const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendBetaNotification = async (data) => {
    try {
        const result = await resend.emails.send({
            from: 'TCG <onboarding@resend.dev>',
            to: process.env.ADMIN_EMAIL,
            subject: 'Nuova richiesta beta',
            html: `<p>${data.email}</p>`
        });

        console.log("✅ RESEND RISPOSTA:", result);

    } catch (err) {
        console.error("❌ ERRORE RESEND:", err);
        throw err;
    }
};