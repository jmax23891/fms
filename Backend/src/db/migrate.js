require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const pool = require('./pool');
(async () => {
 const client=await pool.connect();
 try {
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const dir=path.join(__dirname,'../../migrations');
  for(const file of fs.readdirSync(dir).filter(x=>/^\d+_.*\.sql$/.test(x)).sort()){
   const id=file.replace(/\.sql$/,'');
   const done=await client.query('SELECT 1 FROM schema_migrations WHERE id=$1',[id]);
   if(done.rowCount){console.log(`Migration ${id} already applied.`);continue;}
   await client.query('BEGIN');
   try { await client.query(fs.readFileSync(path.join(dir,file),'utf8')); await client.query('INSERT INTO schema_migrations(id) VALUES($1)',[id]); await client.query('COMMIT'); console.log(`Migration ${id} applied successfully.`); }
   catch(e){await client.query('ROLLBACK');throw e;}
  }
 } catch(e){console.error('Migration failed:',e.message);process.exitCode=1;}
 finally{client.release();await pool.end();}
})();
