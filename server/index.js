const Koa = require('koa')
const session = require('koa-session')
const bodyParser = require('koa-bodyparser')
const passport = require('./lib/passort')
const router = require('./routes')
const config = require('./config/server')

const app = new Koa()

// sessions
app.keys = config.SESSION_KEYS
app.use(session(app))

// body parser
app.use(bodyParser())

// auth
app.use(passport.initialize())
app.use(passport.session())

// routes
app.use(router.routes())

// server
app.listen(80, () => {
	console.log('You have to setup at first time: npm run setup')
	console.log('Server is running at http://localhost')
})