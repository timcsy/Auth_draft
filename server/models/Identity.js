const mongoose = require('./mongoose')

const options = {discriminatorKey: 'type'}

const identitySchema = new mongoose.Schema({
	user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
}, options)

const Identity = mongoose.model('Identity', identitySchema)

module.exports = Identity