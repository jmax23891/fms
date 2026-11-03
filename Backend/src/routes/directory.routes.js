const router=require('express').Router();const pool=require('../db/pool');const {asyncHandler}=require('../utils/errors');const {authenticate}=require('../middleware/auth');
router.get('/departments',asyncHandler(async(req,res)=>{const q=await pool.query('SELECT id,name FROM departments WHERE is_active=true ORDER BY name');res.json({departments:q.rows});}));
router.get('/teachers',authenticate,asyncHandler(async(req,res)=>{const q=await pool.query("SELECT u.id,u.full_name,u.department_id,d.name AS department FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE u.role='teacher' AND u.is_active=true ORDER BY u.full_name");res.json({teachers:q.rows});}));
router.get('/tags',asyncHandler(async(req,res)=>{const q=await pool.query('SELECT id,name,description FROM tags WHERE is_active=true ORDER BY name');res.json({tags:q.rows});}));
module.exports=router;
