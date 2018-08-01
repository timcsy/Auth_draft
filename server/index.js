const Koa = require('koa')
const session = require('koa-session')
const bodyParser = require('koa-bodyparser')
const passport = require('./passort')
const router = require('./routes')

const app = new Koa()

// sessions
app.keys = ['super-secret-key']
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
	console.log('Server is running at http://localhost')
})