const {Schema, model} = require('mongoose')

const UploadSchema = new Schema({
    guid: String,
    image: {
        type: Buffer
    },
    commentary: String
})

const Upload = model('Upload', UploadSchema);

module.exports = Upload;