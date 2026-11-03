const crypto=require('node:crypto');
const env=require('../config/env');
const {AppError}=require('../utils/errors');
function issueCsrf(res){ const token=crypto.randomBytes(24).toString('hex'); res.cookie('sfs_csrf',token,{httpOnly:false,secure:env.COOKIE_SECURE,sameSite:env.COOKIE_SAME_SITE,path:'/'}); return token; }
function requireCsrf(req,res,next){ const cookie=req.cookies?.sfs_csrf, header=req.get('x-csrf-token'); if(!cookie||!header||cookie.length!==header.length||!crypto.timingSafeEqual(Buffer.from(cookie),Buffer.from(header))) return next(new AppError(403,'CSRF validation failed','CSRF_FAILED')); next(); }
module.exports={issueCsrf,requireCsrf};
