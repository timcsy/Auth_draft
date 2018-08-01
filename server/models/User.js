const mongoose = require('./mongoose')
const Identity = require('./Identity')

const userSchema = new mongoose.Schema({})

const User = mongoose.model('User', userSchema)

module.exports = User