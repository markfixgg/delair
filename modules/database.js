const mongoose = require('mongoose');
const {MONGO_URL} = require('../config')

module.exports = async () => {
    await mongoose.connect(MONGO_URL, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
        .then(res => console.log(`Connected to database!`))
        .catch(err => console.log(`Error happened while connecting database`))

    return;
}