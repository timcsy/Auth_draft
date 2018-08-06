const mongoose = require('./Database/mongoose')

const userSchema = new mongoose.Schema({
	groups: [{type: mongoose.Schema.Types.ObjectId, ref: 'Group'}],
	roles: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role'}],
	permissions: [String],
	action: {type: String, default: 'allow'}
})

userSchema.virtual('identities', {
	ref: 'Identity',
	localField: '_id',
	foreignField: 'user'
})

userSchema.statics.link = async function(former, latter) { // link accounts
	const res = await this.model('Identity').updateMany({'user': latter}, {$set: {'user': former}}).exec()
	await this.model('User').findByIdAndRemove(latter).exec()
	// ... more you want to deal with user combination
	return res
}

const User = mongoose.model('User', userSchema)

module.exports = User