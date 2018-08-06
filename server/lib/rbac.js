const minimatch = require('minimatch')
const Role = require('../models/Role')
const User = require('../models/User')
const Group = require('../models/Group')

class RBAC {
	static async addPrincipalRoles(Principal, principalId, roles) {
		const principal = await Principal.findById(principalId).exec()
		if (typeof roles === 'string') {
			const role = await Role.findOrCreate(roles)
			if (principal.roles.indexOf(role._id) === -1) principal.roles.push(role)
			await principal.save()
		} else {
			for (const r of roles) {
				const role = await Role.findOrCreate(r)
				if (principal.roles.indexOf(role._id) === -1) principal.roles.push(role)
			}
			await principal.save()
		}
	}

	static async addUserRoles(userId, roles) {
		await this.addPrincipalRoles(User, userId, roles)
	}

	static async addGroupRoles(groupId, roles) {
		await this.addPrincipalRoles(Group, groupId, roles)
	}

	static async addRolesInherits(roles, inherits) {
		if (typeof roles === 'string') {
			if (typeof inherits === 'string') {
				const role = await Role.findOrCreate(roles)
				const parent = await Role.findOrCreate(inherits)
				if (role.inherits.indexOf(parent._id) === -1) role.inherits.push(parent)
				await role.save()
			} else {
				const role = await Role.findOrCreate(roles)
				for (const r of inherits) {
					const parent = await Role.findOrCreate(r)
					if (role.inherits.indexOf(parent._id) === -1) role.inherits.push(parent)
				}
				await role.save()
			}
		} else {
			for (const r of roles)
				this.addRolesInherits(r, inherits)
		}
	}

	static async addPrincipalPermissions(Principal, principalId, permissions, action) {
		action = action || 'allow'
		const principal = await Principal.findById(principalId).exec()
		if (principal.action !== action) {
			principal.action = action
			principal.permissions = []
		}
		if (typeof permissions === 'string') {
			if (principal.permissions.indexOf(permissions) === -1) principal.permissions.push(permissions)
		} else {
			for (const p of permissions)
				if (principal.permissions.indexOf(p) === -1) principal.permissions.push(p)
		}
		await principal.save()
	}

	static async addUserPermissions(userId, permissions, action) {
		await this.addPrincipalPermissions(User, userId, permissions, action)
	}

	static async addGroupPermissions(groupId, permissions, action) {
		await this.addPrincipalPermissions(Group, groupId, permissions, action)
	}

	static async addRolesPermissions(roles, permissions, action) {
		action = action || 'allow'
		if (typeof roles === 'string') {
			const role = await Role.findOrCreate(roles)
			if (role.action !== action) {
				role.action = action
				role.permissions = []
			}
			if (typeof permissions === 'string') {
				if (role.permissions.indexOf(permissions) === -1) role.permissions.push(permissions)
			} else {
				for (const p of permissions)
					if (role.permissions.indexOf(p) === -1) role.permissions.push(p)
			}
			await role.save()
		} else {
			for (const r of roles)
				await this.addRolesPermissions(r, permissions, action)
		}
	}

	static async config(permissionsArray) {
		for (const p of permissionsArray) {
			if (p.roles && p.permissions)
				await this.addRolesPermissions(p.roles, p.permissions, p.action)
			if (p.roles && p.inherits)
				await this.addRolesInherits(p.roles, p.inherits)
		}
	}

	static async check(userId, permission, data) {
		if (data && data.owners) { // if data not null check if the user or the user's group owns the data
			if (data.owners.indexOf(userId) >= 0) return await this._findUserPermission(userId, permission)
			const user = await User.findById(userId).exec()
			for (const gId of user.groups)
				if (data.owners.indexOf(gId) >= 0) return await this._findGroupPermission(gId, permission)
			return false
		}
		return await this._findUserPermission(userId, permission)
	}

	static middleware(permission) {
		return async (ctx, next) => {
			const available = await this.check(ctx.state.user, permission)
			if (available) await next()
			else ctx.throw(401)
		}
	}

	static _match(str, pattern) {
		// including glob(translate to regex)
		const arr_str = str.split(':')
		const arr_pattern = pattern.split(':')
		if (arr_str.length !== 2) throw(new Error('Permission should be resource:method pattern'))
		if (arr_pattern.length !== 2) throw(new Error('Permission should be resource:method pattern'))
		return minimatch(arr_str[0], arr_pattern[0]) && minimatch(arr_str[1], arr_pattern[1])
	}

	static _hasPermission(obj, permisison) {
		if (obj.action === 'allow') {
			for (const p of obj.permissions)
				if (this._match(p, permisison)) return true
			return false
		} else if (obj.action === 'deny') {
			for (const p of obj.permissions)
				if (this._match(p, permisison)) return false
			return true
		} else return false
	}

	static async _findUserPermission(userId, permission) {
		const user = await User.findById(userId).exec()
		// find all the permissions of user
		if (this._hasPermission(user, permission)) return true
		// find all the permissions of user's roles
		for (const rId of user.roles)
			if (await this._findRolePermission(rId, permission)) return true
		// find all the permissions of user's groups
		for (const gId of user.groups)
			if (await this._findGroupPermission(gId, permission)) return true
		return false
	}

	static async _findGroupPermission(groupId, permission) {
		const group = await Group.findById(groupId).exec()
		// find all the permissions of group
		if (this._hasPermission(group, permission)) return true
		// find all the permissions of group's roles
		for (const rId of group.roles)
			if (await this._findRolePermission(rId, permission)) return true
		// find all the permissions of group's groups
		for (const gId of group.groups)
			if (await this._findGroupPermission(gId, permission)) return true
		return false
	}

	static async _findRolePermission(roleId, permission) {
		const role = await Role.findById(roleId).exec()
		// find all the permissions of role
		if (this._hasPermission(role, permission)) return true
		// find all the permissions of role's inherited roles
		for (const rId of role.inherits)
			if (await this._findRolePermission(rId, permission)) return true
		return false
	}
}

module.exports = RBAC