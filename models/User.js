const {Schema, model} = require('mongoose')

const UserSchema = new Schema({
    login: String,
    password: String,
    loggedIn: {
        type: Boolean,
        default: false
    }
})

const User = model('User', UserSchema);

module.exports = User;