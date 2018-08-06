const mongoose = require('./Database/mongoose')

const groupSchema = new mongoose.Schema({
	groups: [{type: mongoose.Schema.Types.ObjectId, ref: 'Group'}],
	roles: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role'}],
	permissions: [String],
	action: {type: String, default: 'allow'}
})

groupSchema.virtual('users', {
	ref: 'User',
	localField: '_id',
	foreignField: 'groups'
})

const Group = mongoose.model('Group', groupSchema)

module.exports = Group