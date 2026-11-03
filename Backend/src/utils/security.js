const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');
const hashInvitation = code => crypto.createHmac('sha256', env.INVITATION_PEPPER).update(code).digest('hex');
const randomToken = () => crypto.randomBytes(48).toString('base64url');
const hashPassword = password => bcrypt.hash(password, 12);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);
module.exports = { hashToken, hashInvitation, randomToken, hashPassword, comparePassword };
