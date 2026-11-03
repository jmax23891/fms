const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(projectRoot, 'Frontend/index.html'), 'utf8');
const frontendAuth = fs.readFileSync(path.join(projectRoot, 'Frontend/assets/js/auth.js'), 'utf8');
const backendAuth = fs.readFileSync(path.join(projectRoot, 'Backend/src/routes/auth.routes.js'), 'utf8');
const migration = fs.readFileSync(path.join(projectRoot, 'Backend/migrations/003_registration_email_otp.sql'), 'utf8');

test('signup HTML IDs match OTP JavaScript selectors', () => {
  for (const id of ['send-registration-otp', 'verify-registration-otp', 'registration-otp', 'otp-status', 'register-submit']) {
    assert.match(html, new RegExp(`id="${id}"`), `HTML must contain #${id}`);
    assert.ok(frontendAuth.includes(`#${id}`), `auth.js must bind #${id}`);
  }
});

test('frontend OTP requests match mounted backend endpoints', () => {
  assert.ok(frontendAuth.includes("api('/auth/registration-otp'"));
  assert.ok(frontendAuth.includes("api('/auth/verify-registration-otp'"));
  assert.match(backendAuth, /router\.post\('\/registration-otp'/);
  assert.match(backendAuth, /router\.post\('\/verify-registration-otp'/);
  assert.match(backendAuth, /router\.post\('\/register'/);
});

test('registration requires a verified, unconsumed, unexpired OTP in the database', () => {
  assert.match(backendAuth, /verified_at IS NOT NULL/);
  assert.match(backendAuth, /consumed_at IS NULL/);
  assert.match(backendAuth, /expires_at > now\(\)/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS registration_email_otps/);
});

test('login endpoint does not require an OTP field', () => {
  const loginRoute = backendAuth.slice(backendAuth.indexOf("router.post('/login'"), backendAuth.indexOf("router.post('/refresh'"));
  assert.ok(loginRoute.includes("password"));
  assert.ok(!loginRoute.includes("otpVerified"));
});

test('fresh database migration is compatible with migration runner bootstrap', () => {
  const migrationRunner = fs.readFileSync(path.join(projectRoot, 'Backend/src/db/migrate.js'), 'utf8');
  const initialMigration = fs.readFileSync(path.join(projectRoot, 'Backend/migrations/001_initial.sql'), 'utf8');
  assert.match(migrationRunner, /CREATE TABLE IF NOT EXISTS schema_migrations/);
  assert.match(initialMigration, /CREATE TABLE IF NOT EXISTS schema_migrations/);
  assert.match(migrationRunner, /CREATE TABLE IF NOT EXISTS registration_email_otps/);
});
