const controllers = require('./controllers')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const User = require('./models/User')
const {JWT_ACCESS_SECRET} = require('./config')

const getAuthToken = (req, res, next) => {
    const {authorization} = req.headers;

    if(authorization && authorization.split(' ')[0] === "Bearer") {
        req.token = authorization.split(' ')[1];
    } else {
        req.token = null;
    }

    return next()
}

const checkIfAuthenticated = async (req, res, next) => {
    try {
        getAuthToken(req, res, async () => {
            const {token} = req;
            if(!token) return res.send({success: false, error: "Missing token in headers!"});

            jwt.verify(token, JWT_ACCESS_SECRET, async (err, decoded) => {
                if(err) return res.send({success: false, error: err})

                const user = await User.findOne({login: decoded.login})
                if(!user.loggedIn) return  res.send({success: false, error: "User logged out, login again!"})
                req.user = decoded;

                return next()
            })
        })
    } catch (e) {
        return res.status(500).send({success: false, error: e.message})
    }
}

const upload = multer({
    // dest: 'images',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)){
            cb(new Error('Please upload an image.'))
        }
        cb(undefined, true)
    }
})

module.exports = (app) => {
    // Example route
    app.post('/user', checkIfAuthenticated, async (req, res) => {
        const {login} = req.user;
        if(!login) return res.send({success: false, error: 'Missing user in request!'})

        const user = await User.findOne({login: login})

        res.send({success: true, user})
    })

    // Auth routes
    app.post('/register', controllers.AuthCtrl.register) // login, password
    app.post('/login', controllers.AuthCtrl.login) // login, password
    app.post('/logout', checkIfAuthenticated, controllers.AuthCtrl.logout) // authorization header - required!
    // app.post('/refresh', controllers.AuthCtrl.refresh)

    // Job routes
    app.post('/lunch', checkIfAuthenticated, controllers.JobsCtrl.lunch) // lunch state ON/OFF
    app.post('/shift', checkIfAuthenticated, controllers.JobsCtrl.shift) // shift state ON/OFF
    app.post('/receiveJob', checkIfAuthenticated, controllers.JobsCtrl.receiveJob) // create new job
    app.post('/job', checkIfAuthenticated, controllers.JobsCtrl.change_state) // change state of job
    app.post('/sendQueueElements', checkIfAuthenticated, controllers.JobsCtrl.sendQueueElements)
    app.post('/getJobs', checkIfAuthenticated, controllers.JobsCtrl.get_all) // return all job list
    app.post('/getJob/:jobId', checkIfAuthenticated, controllers.JobsCtrl.get_by_id) // return exact job

    // Upload routes
    app.post('/sendPhoto', checkIfAuthenticated, upload.single('image'), controllers.UploadsCtrl.sendPhoto) // upload new image - "formdata"
    app.post('/getPhotos', checkIfAuthenticated,  controllers.UploadsCtrl.get_all) // return all images list
    app.post('/getPhoto/:guid', checkIfAuthenticated,  controllers.UploadsCtrl.get_by_id) // return exact image
    app.post('/deletePhoto/:guid', checkIfAuthenticated, controllers.UploadsCtrl.delete) // delete exact image

    return app
}