const {AppError}=require('../utils/errors');
function notFound(req,res,next){ next(new AppError(404,'Route not found','NOT_FOUND')); }
function errorHandler(err,req,res,next){
  if(err?.code==='23505') return res.status(409).json({error:{code:'DUPLICATE',message:'A record with that unique value already exists.'}});
  if(err?.code==='23503') return res.status(400).json({error:{code:'INVALID_REFERENCE',message:'A referenced record is invalid.'}});
  const status=err.status||500;
  if(status>=500) console.error(err);
  res.status(status).json({error:{code:err.code||'INTERNAL_ERROR',message:status>=500?'An unexpected server error occurred.':err.message}});
}
module.exports={notFound,errorHandler};
