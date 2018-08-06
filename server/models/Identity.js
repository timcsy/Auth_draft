const mongoose = require('./Database/mongoose')
const User = require('./User')

const options = {discriminatorKey: 'type'}

const identitySchema = new mongoose.Schema({
	user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
}, options)

identitySchema.methods.unlink = async function() {
	if ((await this.model('Identity').find({user: this.user}, {}).exec()).length > 1) {
		const user = new User()
		await user.save()
		this.user = user
		await this.save()
	}
}

const Identity = mongoose.model('Identity', identitySchema)

module.exports = Identity