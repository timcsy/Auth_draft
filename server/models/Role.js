const mongoose = require('./Database/mongoose')

const roleSchema = new mongoose.Schema({
	value: {type: String, unique: true},
	inherits: [{type: mongoose.Schema.Types.ObjectId, ref: 'Role'}],
	permissions: [String], // resource:method
	action: {type: String, default: 'allow'}
})

roleSchema.statics.findOrCreate = async function(rolename) {
	let role = await this.model('Role').findOne({value: rolename}).exec()
	if (!role) {
		role = new Role({value: rolename})
		await role.save()
	}
	return role
}

const Role = mongoose.model('Role', roleSchema)

module.exports = Role