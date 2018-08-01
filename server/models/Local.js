const mongoose = require('./mongoose')
const Identity = require('./Identity')

const localSchema = new mongoose.Schema({
	username: String,
	password: String
})

const Local = Identity.discriminator('local', localSchema)

module.exports = Local