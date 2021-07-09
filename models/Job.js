const {Schema, model} = require('mongoose')

const JobSchema = new Schema({
    jobId: String,
    payType: String,
    serviceCode: String,
    address: {
        type: String,
        default: null
    },
    lat: {
        type: String,
        default: null
    },
    lng: {
        type: String,
        default: null
    },
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
    userId: String,
    time: String
})

const Job = model('Job', JobSchema);

module.exports = Job;