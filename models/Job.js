const {Schema, model} = require('mongoose')

const JobSchema = new Schema({
    jobId: String,
    payType: String,
    serviceCode: String,
    state: {
        type: String,
        default: 'START'
    },
    lunch: {
        type: String,
        default: 'OFF'
    },
    shift: {
        type: String,
        default: 'OFF'
    },
    time: String
})

const Job = model('Job', JobSchema);

module.exports = Job;