const User = require('../../models/User')
const jwt = require('jsonwebtoken')
const {JWT_ACCESS_SECRET} = require('../../config')

class AuthCtrl {
    async register (req, res) {
        try {
            const {login, password} = req.body;
            if(!login || !password) return res.send({success: false, error: `Missing login or password field!`})

            const user = await User.findOne({login});
            if(user) return res.send({success: false, error: "User already registered!"})

            await User.create({login, password})
            res.send({success: true, message: "User created! Now you can sign in."})
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }

    async login (req, res) {
        try {
            const {login, password} = req.body;
            if(!login || !password) return res.send({success: false, error: `Missing login or password field!`})

            const user = await User.findOne({login, password});
            if(!user) return res.send({success: false, error: "Login or password incorrect!"})

            const token = jwt.sign({login, _id: user._id}, JWT_ACCESS_SECRET, {expiresIn: '24h'})
            await User.findOneAndUpdate({login}, {loggedIn: true})

            res.send({success: true, token})
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }

    async logout (req, res) {
        try {
            const {login} = req.user;
            if(!login) return res.send({success: false, error: 'Missing login!'})

            const user = await User.findOne({login});
            if(!user) return res.send({success: false, error: "User not found!"})

            await User.findOneAndUpdate({login}, {loggedIn: false})
            res.send({success: true})
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }

    async refresh (req, res) {

    }
}

module.exports = new AuthCtrl()