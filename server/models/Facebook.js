const mongoose = require('./mongoose')
const Identity = require('./Identity')

const facebookSchema = new mongoose.Schema({
	id: String,
	name: String,
	email: String,
	picture: String,
	accessToken: String
})

const Facebook = Identity.discriminator('facebook', facebookSchema)

module.exports = Facebook