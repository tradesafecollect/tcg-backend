const db = require('../config/database');

exports.createTournament = async (req,res)=>{

    try{

        const {
            title,
            description,
            banner_url,
            qualification_slots,
            free_entry,
            entry_burn_required,
            start_date,
            end_date
        } = req.body;

        await db.query(`
            INSERT INTO tournaments
            (
                title,
                description,
                banner_url,
                qualification_slots,
                free_entry,
                entry_burn_required,
                start_date,
                end_date
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8)
        `,[
            title,
            description,
            banner_url,
            qualification_slots,
            free_entry,
            entry_burn_required,
            start_date,
            end_date
        ]);

        res.json({
            message:'Torneo creato'
        });

    }catch(err){

        res.status(500).json({
            error:err.message
        });
    }
};