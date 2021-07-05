const Job = require('../../models/Job')

class JobsCtrl {
    async receiveJob (req, res) {
        try {
            const {jobId, payType, serviceCode, time} = req.body;
            if(!jobId) return res.send({success: false, error: 'Missing jobId!'})
            if(!payType || !['HR', 'JR'].includes(payType)) return res.send({success: false, error: 'Incorrect payType! Pay type must be HR/JR'})
            if(!serviceCode) return res.send({success: false, error: 'Missing serviceCode!'})
            if(!time) return res.send({success: false, error: 'Missing time!'})

            await Job.create({jobId, payType, serviceCode, time})

            res.send({success: true})
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }

    async change_state (req, res) {
        try {
            const {jobId, action} = req.body;
            if(!jobId) return res.send({success: false, error: 'Missing jobId!'})
            if(!action || !['FINISH', 'START'].includes(action)) return res.send({success: false, error: 'Incorrect action! Action must be START/FINISH'})

            const check = await Job.findOne({jobId});
            if(!check) return res.send({success: false, error: `Job with jobId: ${jobId} not found`})

            await Job.findByIdAndUpdate(check._id, {state: action})

            res.send({success: true})
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }

    async lunch (req, res) {
        try {
            const {state, jobId, time} = req.body;

            if(!jobId) return res.send({success: false, error: 'Missing jobId!'})
            if(!state || !['ON', 'OFF'].includes(state)) return res.send({success: false, error: 'Incorrect state! State must be ON/OFF'})
            if(!time) return res.send({success: false, error: 'Missing time!'})

            const check = await Job.findOne({jobId});
            if(!check) return res.send({success: false, error: `Job with jobId: ${jobId} not found`})
            if(check.shift === "OFF") return res.send({success: false, error: 'Job shift is OFF!'})

            await Job.findByIdAndUpdate(check._id, {lunch: state, time})

            res.send({success: true})
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }

    async shift (req, res) {
        try {
            const {state, jobId, time} = req.body;
            if(!state || !['ON', 'OFF'].includes(state)) return res.send({success: false, error: 'Incorrect state! State must be ON/OFF'})
            if(!jobId) return res.send({success: false, error: 'Missing jobId!'})
            if(!time) return res.send({success: false, error: 'Missing time!'})

            const check = await Job.findOne({jobId});
            if(!check) return res.send({success: false, error: `Job with jobId: ${jobId} not found`})

            await Job.findByIdAndUpdate(check._id, {
                lunch: state === 'OFF' ? state : check.lunch,
                shift: state,
                state: state === "ON" ? "START" : "FINISH",
                time
            })

            res.send({success: true})
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }

    async get_by_id (req, res) {
        try {
            const {jobId} = req.params;
            if(!jobId) return res.send({success: false, error: 'Missing id!'})

            const job = await Job.findOne({jobId})

            if(!job) return res.send({success: false, error: `Job with id: ${jobId} not found!`})

            res.send({success: true, job})
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }

    async get_all (req, res) {
        try {
            const jobs = await Job.find();
            res.send({success: true, jobs})
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }
}

module.exports = new JobsCtrl()