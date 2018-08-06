const mongoose = require('./Database/mongoose')

const dataSchema = new mongoose.Schema({
	owners: [{type: mongoose.Schema.Types.ObjectId}]
})

const Data = mongoose.model('Data', dataSchema)

module.exports = Data