const Router = require('koa-router')
const views = require('koa-views')
const path = require('path')

const authRouter = require('./auth')
const dataRouter = require('./data')
const apiRouter = require('./api')

const router = new Router()

router.use(views(path.resolve(__dirname, '../../views'), {
	extension: 'ejs'
}))

// Auth resource
router.use(authRouter.routes())

// Data resource
router.use(dataRouter.routes())

// API resource
router.use(apiRouter.routes())



// The following is for test------------------------------------------------

const RBAC = require('../lib/rbac')

router.get('/guest', RBAC.auth(true), async (ctx) => {
	ctx.body = {message: 'Guest can see me', user: ctx.state.user}
})

router.get('/secret', RBAC.auth(), async (ctx) => {
	ctx.body = {message: 'You can see me', user: ctx.state.user}
})

module.exports = router