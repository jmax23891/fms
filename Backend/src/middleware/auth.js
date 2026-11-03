const jwt = require('jsonwebtoken');
const env = require('../config/env');
const pool = require('../db/pool');
const { AppError, asyncHandler } = require('../utils/errors');
const authenticate = asyncHandler(async (req,res,next) => {
  const header=req.headers.authorization||'';
  if (!header.startsWith('Bearer ')) throw new AppError(401,'Authentication required','AUTH_REQUIRED');
  let payload; try { payload=jwt.verify(header.slice(7),env.JWT_ACCESS_SECRET); } catch { throw new AppError(401,'Session expired or invalid','AUTH_INVALID'); }
  const { rows }=await pool.query('SELECT id,full_name,email,role,department_id,is_active,is_revoked FROM users WHERE id=$1',[payload.sub]);
  const user=rows[0]; if(!user||!user.is_active||user.is_revoked) throw new AppError(401,'Account is inactive or unavailable','ACCOUNT_INACTIVE');
  req.user=user; next();
});
const allow = (...roles) => (req,res,next) => { if(!req.user||!roles.includes(req.user.role)) return next(new AppError(403,'You are not allowed to perform this action','FORBIDDEN')); next(); };
module.exports={authenticate,allow};
