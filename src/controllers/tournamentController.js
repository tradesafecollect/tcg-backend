const db = require('../config/database');

exports.createTournament = async (req, res) => {

    try {

        const {
            title,
            slug,
            description,
            prize,
            rules,
            max_players,
            entry_fee,
            status,
            start_date,
            end_date,
            banner_url,
            boost_rewards,
            max_attempts,
            tournament_type,
            qualification_slots,
            free_entry,
            entry_burn_required,
            burn_cards_required,
            tournament_phase,
            leaderboard_visible
        } = req.body;

        const result = await db.query(`
            INSERT INTO tournaments (
                title,
                slug,
                description,
                prize,
                rules,
                max_players,
                entry_fee,
                status,
                start_date,
                end_date,
                banner_url,
                boost_rewards,
                max_attempts,
                tournament_type,
                qualification_slots,
                free_entry,
                entry_burn_required,
                burn_cards_required,
                tournament_phase,
                leaderboard_visible
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
                $11,$12,$13,$14,$15,$16,$17,$18,$19,$20
            )
            RETURNING id
        `, [
            title,
            slug,
            description,
            prize,
            rules,
            max_players,
            entry_fee,
            status || 'draft',
            start_date,
            end_date,
            banner_url,
            boost_rewards,
            max_attempts || 1,
            tournament_type || 'qualification',
            qualification_slots || 0,
            free_entry ?? true,
            entry_burn_required ?? false,
            burn_cards_required || 1,
            tournament_phase || 'upcoming',
            leaderboard_visible ?? true
        ]);

        res.status(201).json({
            message: 'Torneo creato con successo',
            tournamentId: result.rows[0].id
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });
    }
};