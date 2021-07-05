const Job = require('../../models/Job')

class JobsCtrl {
    async receiveJob (req, res) {
        try {
            const {jobId, payType, serviceCode, time} = req.body;
            const {_id} = req.user;
            if(!jobId) return res.send({success: false, error: 'Missing jobId!'})
            if(!payType || !['HR', 'JR'].includes(payType)) return res.send({success: false, error: 'Incorrect payType! Pay type must be HR/JR'})
            if(!serviceCode) return res.send({success: false, error: 'Missing serviceCode!'})
            if(!time) return res.send({success: false, error: 'Missing time!'})

            await Job.create({jobId, payType, serviceCode, time, userId: _id})

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
            const {_id} = req.user;
            // if(!jobId) return res.send({success: false, error: 'Missing jobId!'})
            if(!state || !['ON', 'OFF'].includes(state)) return res.send({success: false, error: 'Incorrect state! State must be ON/OFF'})
            if(!time) return res.send({success: false, error: 'Missing time!'})

            if(jobId) {
                const check = await Job.findOne({jobId});
                if(!check) return res.send({success: false, error: `Job with jobId: ${jobId} not found`})
                if(check.shift === "OFF") return res.send({success: false, error: 'Job shift is OFF!'})

                await Job.findByIdAndUpdate(check._id, {lunch: state, time})
            } else {
                await Job.updateMany({userId: _id, shift: 'ON'}, {lunch: state})
            }

            res.send({success: true})
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }

    async shift (req, res) {
        try {
            const {state, jobId, time} = req.body;
            const {_id} = req.user;

            if(!state || !['ON', 'OFF'].includes(state)) return res.send({success: false, error: 'Incorrect state! State must be ON/OFF'})
            // if(!jobId) return res.send({success: false, error: 'Missing jobId!'})
            if(!time) return res.send({success: false, error: 'Missing time!'})

            if(jobId) {
                const check = await Job.findOne({jobId});
                if(!check) return res.send({success: false, error: `Job with jobId: ${jobId} not found`})

                await Job.findByIdAndUpdate(check._id, {
                    lunch: state === 'OFF' ? state : check.lunch,
                    shift: state,
                    state: state === "ON" ? "START" : "FINISH",
                    time
                })
            } else {
                await Job.updateMany({userId: _id}, {shift: state})
            }


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
    // /sendPunches
    async punches (req, res) {
        const {query} = req.body;
        let json;

        try {
            json = JSON.parse(query)
        } catch (e) {
            res.send({success: false, error: "Invalid json query"})
        }

        let results = await Promise.all(
            json.map(async item => {
            const {type, jobId, serviceCode, lat, lng, time} = item;
            if(!jobId) return {success: false, error: 'Missing jobId!'}
            if(!time) return {success: false, error: 'Missing time!'}
            if(!type || !['SS', 'SE', 'LS', 'LE', 'JS', 'JE', 'GEO'].includes(type)) return {success: false, error: 'Incorrect type, must be SS, SE, LS, LE, JS, JE, GEO!'}

            switch (type) {
                case 'SS':
                    await Job.findOneAndUpdate({jobId}, {shift: 'ON', time})
                    return {jobId, type, success: true}
                    break;
                case 'SE':
                    await Job.findOneAndUpdate({jobId}, {shift: 'OFF', time})
                    return {jobId, type, success: true}
                    break;
                case 'LS':
                    await Job.findOneAndUpdate({jobId}, {lunch: 'ON', time})
                    return {jobId, type, success: true}
                    break;
                case 'LE':
                    await Job.findOneAndUpdate({jobId}, {lunch: 'OFF', time})
                    return {jobId, type, success: true}
                    break;
                case 'JS':
                    await Job.findOneAndUpdate({jobId}, {state: 'START', time})
                    return {jobId, type, success: true}
                    break;
                case 'JE':
                    await Job.findOneAndUpdate({jobId}, {state: 'FINISH', time})
                    return {jobId, type, success: true}
                    break;
                case 'GEO':
                    if(!lat || !lng) return res.send({success: false, error: 'Missing lat, lng'})
                    await Job.findOneAndUpdate({jobId}, {lat, lng, time})
                    return {jobId, type, success: true}
                    break;
                default:
                    return {success: false, error: 'Type not found'}
                    break;
            }

        })
        )

        res.send({success: true, results })
    }

}

module.exports = new JobsCtrl()