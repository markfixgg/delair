const Job = require('../../models/Job')
const Upload = require('../../models/Upload')
class JobsCtrl {
    async receiveJob (req, res) {
        try {
            const {jobId, payType, serviceCode, address, time} = req.body;
            const {_id} = req.user;
            if(!jobId) return res.send({success: false, error: 'Missing jobId!'})
            if(!payType || !['HR', 'JR'].includes(payType)) return res.send({success: false, error: 'Incorrect payType! Pay type must be HR/JR'})
            if(!address) return res.send({success: false, error: 'Missing address!'})
            if(!time) return res.send({success: false, error: 'Missing time!'})

            const check = await Job.findOne({jobId});
            if(check) return res.send({success: false, error: `Job with jobId: ${jobId} already exists!`})

            await Job.create({jobId, payType, serviceCode, time, userId: _id, address})

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
            const {jobId, payType, serviceCode, time} = req.body;
            const {_id} = req.user;

            if(!jobId) return res.send({success: false, error: 'Missing jobId!'})
            if(!payType || !['HR', 'JR'].includes(payType)) return res.send({success: false, error: 'Incorrect payType! Pay type must be HR/JR'})
            // if(!serviceCode) return res.send({success: false, error: 'Missing serviceCode!'})
            if(!time) return res.send({success: false, error: 'Missing time!'})

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
    async sendQueueElements (req, res) {
        const {query} = req.body;
        const {_id} = req.user;
        let json;

        try {
            json = JSON.parse(query)
        } catch (e) {
            return res.send({success: false, error: "Invalid json query"})
        }

        let results = await Promise.all(
            json.map(async item => {
                const {type, jobId, serviceCode, lat, lng, time, image, guid, commentary} = item;
                // if(!jobId) return {success: false, error: 'Missing jobId!'}
                if(!time) return {success: false, error: 'Missing time!'}
                if(!type || !['SS', 'SE', 'LS', 'LE', 'JS', 'JE', 'GEO', 'PIC'].includes(type)) return {success: false, error: 'Incorrect type, must be SS, SE, LS, LE, JS, JE, GEO!'}

                if(lat && lng && jobId) {
                    await Job.findOneAndUpdate({jobId}, {lat, lng, time})
                }
                else if (lat && lng) {
                    await Job.updateMany({userId: _id}, {lat, lng, time})
                }

                switch (type) {
                    case 'PIC':
                        if (!image) return {success: false, error: 'Missing image byte array'}
                        if (!guid) return {success: false, error: 'Missing guid'}

                        const check = await Upload.findOne({guid})
                        if(check) return {success: false, error: `Image with guid: ${guid} already exist`}

                        // TODO: не уверен что работает
                        const buffer = new Buffer.from(image)
                        await Upload.create({guid, image: buffer, commentary})

                        return {success: true}
                        break;

                    case 'SS':
                        if(jobId) {
                            await Job.findOneAndUpdate({jobId}, {shift: 'ON', time})
                            return {jobId, type, success: true}
                        } else {
                            await Job.updateMany({userId: _id}, {shift: 'ON', time})
                            return {success: true}
                        }

                        break;
                    case 'SE':
                        if(jobId) {
                            await Job.findOneAndUpdate({jobId}, {shift: 'OFF', time})
                            return {jobId, type, success: true}
                        } else {
                            await Job.updateMany({userId: _id}, {shift: 'OFF', time})
                            return {success: true}
                        }
                        break;
                    case 'LS':
                        if(jobId) {
                            await Job.findOneAndUpdate({jobId}, {lunch: 'ON', time})
                            return {jobId, type, success: true}
                        } else {
                            await Job.updateMany({userId: _id}, {lunch: 'ON', time})
                            return {success: true}
                        }

                        break;
                    case 'LE':
                        if(jobId) {
                            await Job.findOneAndUpdate({jobId}, {lunch: 'OFF', time})
                            return {jobId, type, success: true}
                        } else {
                            await Job.updateMany({userId: _id}, {lunch: 'OFF', time})
                            return {success: true}
                        }
                        break;
                    case 'JS':
                        if(jobId) {
                            await Job.findOneAndUpdate({jobId}, {state: 'START', time})
                            return {jobId, type, success: true}
                        } else {
                            await Job.updateMany({userId: _id}, {lunch: 'START', time})
                            return {success: true}
                        }

                        break;
                    case 'JE':
                        if(jobId) {
                            await Job.findOneAndUpdate({jobId}, {state: 'FINISH', time})
                            return {jobId, type, success: true}
                        } else {
                            await Job.updateMany({userId: _id}, {lunch: 'FINISH', time})
                            return {success: true}
                        }

                        break;
                    case 'GEO':
                        if(!lat || !lng) return res.send({success: false, error: 'Missing lat, lng'})
                        if(jobId){
                            await Job.findOneAndUpdate({jobId}, {lat, lng, time})
                            return {jobId, type, success: true}
                        } else {
                            await Job.updateMany({userId: _id}, {lat, lng, time})
                            return {success: true}
                        }

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