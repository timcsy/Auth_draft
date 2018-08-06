const Router = require('koa-router')
const passport = require('koa-passport')
const views = require('koa-views')
const path = require('path')
const Identity = require('../models/Identity')
const User = require('../models/User')

const router = new Router()

router.use(views(path.resolve(__dirname, '../../views'), {
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
	if (ctx.isAuthenticated())
		return passport.authenticate('facebook-connect', {scope: ['public_profile', 'email']})(ctx)
	else ctx.redirect('/')
})
// callback
router.get('/connect/facebook/callback', passport.authenticate('facebook-connect', {
	successRedirect: '/member',
	failureRedirect: '/connect/login'
}))

// unlink--------------------------------------------------
router.get('/unlink/:id', async (ctx) => {
	const identity = await Identity.findById(ctx.params.id).exec()
	identity.unlink()
	ctx.redirect('/member')
})


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
		const user = await User.findById(ctx.state.user).populate('identities').exec()
		await ctx.render('member', {identities: user.identities})
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

const Group = require('../models/Group')
router.get('/group/add', async (ctx) => {
	const group = new Group()
	await group.save()
	const user = await User.findById(ctx.state.user).exec()
	user.groups.push(group)
	user.save()
	ctx.body = '<a href="/group/' + group._id + '">show</a>'
})
router.get('/group/add/:id', async (ctx) => {
	const group = await Group.findById(ctx.params.id).exec()
	const user = await User.findById(ctx.state.user).exec()
	user.groups.push(group)
	user.save()
	ctx.body = '<a href="/group/' + ctx.params.id + '">show</a>'
})
router.get('/group/:id', async (ctx) => {
	const group = await Group.findById(ctx.params.id).populate('users').exec()
	ctx.body = group.users
})

const Data = require('../models/Data')
router.get('/data', async (ctx) => {
	const data = new Data()
	data.owners.push(ctx.state.user)
	await data.save()
	ctx.body = data
})

router.get('/data/:id', async (ctx) => {
	const data = await Data.findById(ctx.params.id)
	if (await RBAC.check(ctx.state.user, 'blog:patch', data))
		ctx.body = data
	else ctx.throw(401)
	// if (await RBAC.check(ctx.state.user, 'blog:put', data))
	// 	ctx.body = data
	// else ctx.throw(401)
})

const RBAC = require('../lib/rbac')
router.get('/role', async (ctx) => {
	const group = new Group()
	await group.save()
	const user = await User.findById(ctx.state.user).exec()
	user.groups.push(group)
	user.save()
	await RBAC.addUserRoles(ctx.state.user, 'member')
	await RBAC.addGroupPermissions(group._id, 'blog:put')
	await RBAC.addRolesInherits('member', 'guest')
	await RBAC.addRolesPermissions('guest', 'blog:get', 'allow')
	await RBAC.addRolesPermissions(['member', 'foo'], ['blog:post'])
	await RBAC.addRolesPermissions('bar', ['blog:get'], 'deny')
	await RBAC.config([
		{
			roles: ['admin', 'local'],
			permissions: 'blog:*',
			inherits: 'member'
		},
		{
			roles: 'baz',
			permissions: '*:*',
			inherits: ['guest', 'foo'],
			action: 'deny'
		}
	])
	await RBAC.addUserPermissions(ctx.state.user, ['blog:put', 'blog:patch'], 'deny')
	console.log(await RBAC.check(ctx.state.user, 'blog:get'))
	console.log(await RBAC.check(ctx.state.user, 'blog:put'))
	console.log(await RBAC.check(ctx.state.user, 'blog:patch'))
	ctx.body = await User.findById(ctx.state.user).exec()
})

router.get('/role/middleware', RBAC.middleware('blog:put'), async (ctx) => {
	ctx.body = 'Hello I\'m blog'
})

module.exports = router