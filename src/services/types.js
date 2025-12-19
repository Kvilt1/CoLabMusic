/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} email
 * @property {Object} user_metadata
 */

/**
 * @typedef {Object} Session
 * @property {string} access_token
 * @property {string} refresh_token
 * @property {User} user
 */

/**
 * @typedef {Object} Vault
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} cover_url
 * @property {string} invite_code
 * @property {string} owner_id
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} VaultMember
 * @property {string} id
 * @property {string} vault_id
 * @property {string} user_id
 * @property {'owner'|'admin'|'member'|'viewer'} role
 * @property {string} status
 * @property {string} display_name
 * @property {string} email
 * @property {string} joined_at
 * @property {string} created_at
 */

/**
 * @typedef {Object} Song
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {string} file_url
 * @property {string} cover_url
 * @property {number} duration
 * @property {string} uploaded_by
 * @property {string} created_at
 */

/**
 * @typedef {Object} ServiceResponse
 * @property {*} data
 * @property {Error|null} error
 */

/**
 * @typedef {Object} AuthStateChange
 * @property {string} event
 * @property {Session|null} session
 */

export {};
