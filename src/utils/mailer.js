const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendBetaNotification = async (data) => {
    try {
        const result = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: process.env.ADMIN_EMAIL,
            subject: 'Nuova richiesta accesso beta',
            html: `
                <h2>Nuova richiesta beta</h2>

                <p><strong>Username:</strong> ${data.username}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Nome:</strong> ${data.nome}</p>
                <p><strong>Cognome:</strong> ${data.cognome}</p>
                <p><strong>Città:</strong> ${data.citta}</p>
                <p><strong>CAP:</strong> ${data.cap}</p>
                <p><strong>Indirizzo 1:</strong> ${data.indirizzo1}</p>
                <p><strong>Indirizzo 2:</strong> ${data.indirizzo2 || '-'}</p>
                <p><strong>Referral:</strong> ${data.referral || '-'}</p>
                <p><strong>Anni di collezionismo:</strong> ${data.anni_collezionismo}</p>
            `
        });

        console.log("✅ RESEND RISPOSTA:", result);

    } catch (err) {
        console.error("❌ ERRORE RESEND:", err);
        throw err;
    }
};

exports.sendUserConfirmation = async (email, username) => {
    const result = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Richiesta Beta Ricevuta',
        html: `
            <h2>Ciao ${username}!</h2>

            <p>Abbiamo ricevuto la tua richiesta di accesso alla beta di DMS - Digital Master Sets.</p>

            <p>Il nostro team la esaminerà e ti contatterà appena possibile.</p>

            <p>Grazie per l'interesse!</p>
        `
    });

    console.log("✅ EMAIL UTENTE:", result);
};