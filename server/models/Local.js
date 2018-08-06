const mongoose = require('./Database/mongoose')
const Identity = require('./Identity')

const localSchema = new mongoose.Schema({
	username: {type: String, unique: true},
	password: String
})

const Local = Identity.discriminator('local', localSchema)

module.exports = Local