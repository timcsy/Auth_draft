const passport = require('koa-passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const FacebookStrategy = require('passport-facebook').Strategy
const config = require('./config/facebook')
const User = require('./models/User')
const Identity = require('./models/Identity')
const Local = require('./models/Local')
const Facebook = require('./models/Facebook')

// on login
passport.serializeUser((user, done) => {
	done(null, user)
})

// read from session
passport.deserializeUser(async (user, done) => {
	done(null, user)
})

async function link(former, latter) { // link accounts
	return await Identity.updateMany({'user': latter}, {$set: {'user': former}}).exec()
}

passport.use('local-login', new LocalStrategy({
	usernameField: 'username',
	passwordField: 'password',
	passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
}, async (req, username, password, done) => {
	try {
		const identity = await Local.findOne({username: username})
		if (!identity) return done(null, false) // user deosn't exist
		const cmp = await bcrypt.compare(password, identity.password)
		if (cmp === false) return done(null, false) // wrong password

		if (req.user) {
			await link(req.user, identity.user)
			done(null, req.user)
		} else {
			done(null, identity.user)
		}
	} catch (err) {
		return done(err, false)
	}
}))

passport.use('local-signup', new LocalStrategy({
	usernameField: 'username',
	passwordField: 'password',
	passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
}, async (req, username, password, done) => {
	try {
		let identity = await Local.findOne({username: username})
		if (identity) return done(null, false) // username is already taken
		const hash = await bcrypt.hash(password, 12)
		identity = new Local({username: username, password: hash})
		
		let user = req.user // if found then link
		if (!user) user = new User()  // if DNE then add user
		identity.user = user
		await identity.save()
		return done(null, identity.user)
	} catch (err) {
		return done(err, false)
	}
}))

async function facebook(req, accessToken, refreshToken, profile, cb) {
	try {
		let identity = await Facebook.findOne({id: profile.id, type: 'facebook'})
		
		if (!identity) {
			identity = new Facebook()
			identity.user = new User()
		}
		identity.id = profile.id
		identity.name = profile.displayName
		identity.email = profile.emails[0].value
		identity.picture = profile.photos[0].value
		identity.accessToken = accessToken

		await identity.save()

		if (req.user) await link(req.user, identity.user)
		if (req.user) return cb(null, req.user)
		else return cb(null, identity.user)
	} catch (err) {
		return cb(err, false)
	}
}

passport.use('facebook-auth', new FacebookStrategy({
	clientID: config.FACEBOOK_APP_ID,
	clientSecret: config.FACEBOOK_APP_SECRET,
	callbackURL: config.AUTH_callbackURL,
	profileFields: ['id', 'displayName', 'photos', 'email'],
	passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
}, facebook))

passport.use('facebook-connect', new FacebookStrategy({
	clientID: config.FACEBOOK_APP_ID,
	clientSecret: config.FACEBOOK_APP_SECRET,
	callbackURL: config.CONNECT_callbackURL,
	profileFields: ['id', 'displayName', 'photos', 'email'],
	passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
}, facebook))

module.exports = passport