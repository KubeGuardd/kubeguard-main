const { v4: uuidv4 } = require('uuid')

const extractHeaders = (req, res, next) => {
  const user = req.entraUser || {}

  let roles = Array.isArray(user.roles)
    ? user.roles.join(',')
    : user.roles || ''

  // TEMP FIX: allow any valid Entra tenant user as Admin
  if (process.env.ALLOW_ALL_ENTRA_USERS === 'true') {
    roles = roles ? `${roles},Admin` : 'Admin'
  }

  req.headers['x-user-id'] = user.oid || ''
  req.headers['x-user-email'] = user.preferred_username || user.email || ''
  req.headers['x-user-name'] = user.name || ''
  req.headers['x-user-roles'] = roles
  req.headers['x-request-id'] = req.headers['x-request-id'] || uuidv4()

  delete req.headers.authorization
  next()
}

module.exports = extractHeaders
