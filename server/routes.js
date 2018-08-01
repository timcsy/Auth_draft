const Router = require('koa-router')
const passport = require('koa-passport')
const views = require('koa-views')
const path = require('path')
const Identity = require('./models/Identity')

const router = new Router()

router.use(views(path.resolve(__dirname, '../views'), {
	extension: 'ejs'
}))

////////////////////////////////////////////////////////////
//                     Authenticate                       //
////////////////////////////////////////////////////////////

// local------------------------------------------------
// login
router.post('/login', passport.authenticate('local-login', {
	successRedirect: '/member',
	failureRedirect: '/login'
}))

// signup
router.post('/signup', passport.authenticate('local-signup', {
	successRedirect: '/member',
	failureRedirect: '/signup'
}))


// facebook------------------------------------------------
// login
router.get('/auth/facebook', passport.authenticate('facebook-auth', {scope: ['public_profile', 'email']}))

// callback
router.get('/auth/facebook/callback', passport.authenticate('facebook-auth', {
	successRedirect: '/member',
	failureRedirect: '/login'
}))


////////////////////////////////////////////////////////////
//                        CONNECT                         //
////////////////////////////////////////////////////////////

// local-----------------------------------------------
// login
router.post('/connect/login', passport.authenticate('local-login', {
	successRedirect: '/member',
	failureRedirect: '/connect/login'
}))

// signup
router.post('/connect/signup', passport.authenticate('local-signup', {
	successRedirect: '/member',
	failureRedirect: '/connect/signup'
}))

// facebook------------------------------------------------
// login
router.get('/connect/facebook', async (ctx) => {
	if (!ctx.isAuthenticated()) ctx.redirect('/')
}, passport.authenticate('facebook-connect', {scope: ['public_profile', 'email']}))

// callback
router.get('/connect/facebook/callback', passport.authenticate('facebook-connect', {
	successRedirect: '/member',
	failureRedirect: '/connect/login'
}))


////////////////////////////////////////////////////////////
//                         Pages                          //
////////////////////////////////////////////////////////////

// index page
router.get('/', async (ctx) => {
	if (ctx.isUnauthenticated()) {
		await ctx.render('index')
	} else {
		ctx.redirect('/member')
	}
})

// login page
router.get('/login', async (ctx) => {
	if (ctx.isUnauthenticated()) {
		await ctx.render('login')
	} else {
		ctx.redirect('/member')
	}
})

// signup page
router.get('/signup', async (ctx) => {
	if (ctx.isUnauthenticated()) {
		await ctx.render('signup')
	} else {
		ctx.redirect('/member')
	}
})

// connect login page
router.get('/connect/login', async (ctx) => {
	if (ctx.isAuthenticated()) {
		await ctx.render('connect_login')
	} else {
		ctx.redirect('/')
	}
})

// connect signup page
router.get('/connect/signup', async (ctx) => {
	if (ctx.isAuthenticated()) {
		await ctx.render('connect_signup')
	} else {
		ctx.redirect('/')
	}
})

// member page
router.get('/member', async (ctx) => {
	if (ctx.isAuthenticated()) {
		const users = await Identity.find({'user': ctx.state.user}).exec()
		await ctx.render('member', {users})
	} else {
		ctx.redirect('/')
	}
})

// logout
router.get('/logout', async (ctx) => {
	if (ctx.isAuthenticated()) {
		ctx.logout()
		ctx.redirect('/')
	} else {
		ctx.body = {success: false}
    ctx.throw(401)
	}
})

module.exports = router