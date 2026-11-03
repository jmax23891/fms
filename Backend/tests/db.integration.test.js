const test=require('node:test');const assert=require('node:assert/strict');
const url=process.env.TEST_DATABASE_URL;
test('PostgreSQL connection and required schema', {skip:!url?'Set TEST_DATABASE_URL to run PostgreSQL integration checks':false}, async()=>{const {Pool}=require('pg');const p=new Pool({connectionString:url});try{const q=await p.query("SELECT to_regclass('public.users') AS users,to_regclass('public.feedback') AS feedback,to_regclass('public.tags') AS tags");assert.ok(q.rows[0].users);assert.ok(q.rows[0].feedback);assert.ok(q.rows[0].tags);}finally{await p.end();}});
