const Upload = require('../../models/Upload')

class UploadsCtrl {
    async sendPhoto (req, res) {
        try {
            const {buffer} = req.file;
            const {guid} = req.body;

            if(!guid) return res.send({success: false, error: 'Missing guid!'})
            if(!buffer) return res.send({success: false, error: 'Missing file!'})

            const check = await Upload.findOne({guid})
            if(check) return res.send('DUPLICATE')

            await Upload.create({image: buffer, guid})

            res.send('OK')
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }

    async delete(req, res) {
        try {
            const {guid} = req.params;
            if(!guid) return res.send({success: false, error: 'Missing guid!'})

            await Upload.findOneAndRemove({guid})

            res.send('OK')
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }

    async get_all(req, res) {
        try {
            const images = await Upload.find();

            res.send({success:true, images})
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }

    async get_by_id(req, res) {
        try {
            const {guid} = req.params;
            if(!guid) return res.send({success: false, error: 'Missing guid!'})

            const image = await Upload.findOne({guid})

            if(!image) return res.send({success: false, error: `Image with guid: ${guid} not found!`})

            res.set('Content-Type', 'image/png')
            res.send(image.image)
        } catch (e) {
            res.status(500).send({success: false, error: e.message})
        }
    }
}

module.exports = new UploadsCtrl()