const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendBetaNotification = async (data) => {
    try {
        const result = await resend.emails.send({
            from: 'TCG <onboarding@resend.dev>',
            to: process.env.ADMIN_EMAIL,
            subject: 'TEST EMAIL',
            html: '<h1>Test</h1>'
        });

        console.log("✅ RESEND RISPOSTA:", result);

    } catch (err) {
        console.error("❌ ERRORE RESEND:", err);
        console.error("❌ MESSAGE:", err.message);
        console.error("❌ FULL:", JSON.stringify(err, null, 2));
        throw err;
    }
};