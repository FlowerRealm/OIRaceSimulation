/**
 * OI Race Simulation — user system API.
 *
 * Everything under /api/ is handled here; every other path falls through to the
 * static assets in public/.
 *
 * A note on trust: the game itself runs entirely in the browser, so a
 * determined player can post whatever score they like. Moving the simulation
 * server-side is the only real fix and that is not what this change is. What
 * the handlers below do is reject scores that are impossible rather than merely
 * improbable — out-of-range levels, skipped levels, absurd totals. That stops
 * casual tampering and nothing more. Do not treat the leaderboard as proof.
 */

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = 'oi_session';
const PBKDF2_ITERATIONS = 100000;

const MAX_LEVEL = 13;
const MAX_MATCH_SCORE = 2000;
// A perfect run is roughly 14 levels x 1600 points x the 3x multiplier, plus
// achievement bonuses. 100000 leaves generous headroom over anything reachable.
const MAX_TOTAL_SCORE = 100000;
const LEADERBOARD_LIMIT = 50;
const MINI_SCORE_COUNT = 6;

const MODES = ['simple', 'normal'];

/* ---------------------------------------------------------------- helpers */

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

function fail(message, status = 400) {
  return json({ error: message }, status);
}

function toBase64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function randomBase64(byteLength) {
  return toBase64(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function hashPassword(password, saltB64) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromBase64(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    256
  );
  return toBase64(new Uint8Array(bits));
}

/** Constant-time compare, so a wrong password leaks nothing through timing. */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request, name) {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

function sessionCookie(token, maxAgeSeconds) {
  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

function validUsername(name) {
  // Any visible characters are fine, including CJK. What is not fine is
  // whitespace or control characters, which make two accounts look identical.
  return typeof name === 'string' && /^[^\s\u0000-\u001f\u007f]{1,16}$/u.test(name);
}

/* ------------------------------------------------------------------- auth */

async function currentUser(request, env) {
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.*, s.expires_at AS session_expires
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token = ?1 AND s.expires_at > ?2`
  )
    .bind(token, Date.now())
    .first();
  return row || null;
}

async function createSession(env, userId) {
  const token = randomBase64(32);
  const now = Date.now();
  // Cheapest possible garbage collection: expired rows go out whenever a new
  // session comes in, so the table never needs a cron job to stay small.
  await env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?1').bind(now).run();
  await env.DB.prepare(
    'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)'
  )
    .bind(token, userId, now, now + SESSION_TTL_MS)
    .run();
  return token;
}

/* ------------------------------------------------------------ user payload */

/** Everything the client needs to boot: identity, settings, achievements. */
async function userPayload(env, user) {
  const [own, firsts] = await Promise.all([
    env.DB.prepare('SELECT mode, ach_id FROM achievements WHERE user_id = ?1').bind(user.id).all(),
    env.DB.prepare(
      `SELECT f.mode, f.ach_id, u.username
         FROM achievement_firsts f JOIN users u ON u.id = f.user_id`
    ).all(),
  ]);

  // Shape matches the old localStorage layout — {simple:{id:{player}}, normal:{...}} —
  // so the rendering code in index.html did not have to be rewritten.
  const achievements = { simple: {}, normal: {} };
  for (const row of own.results) {
    if (achievements[row.mode]) achievements[row.mode][row.ach_id] = { player: user.username };
  }
  for (const row of firsts.results) {
    if (achievements[row.mode] && achievements[row.mode][row.ach_id]) {
      achievements[row.mode][row.ach_id].player = row.username;
    }
  }

  return {
    username: user.username,
    settings: {
      easyMode: !!user.easy_mode,
      easyModeAutoSet: !!user.easy_mode_auto_set,
      hasPlayedBefore: !!user.has_played_before,
      everGotNOIMedal: !!user.got_noi_medal,
    },
    achievements,
  };
}

/* ------------------------------------------------------------ leaderboard */

async function leaderboard(env) {
  const best = await env.DB.prepare(
    `SELECT u.username, r.id AS run_id, r.total_score, r.max_level, r.easy_mode, r.finished
       FROM users u JOIN runs r ON r.id = u.best_run_id
      ORDER BY r.total_score DESC, r.max_level DESC, r.updated_at ASC
      LIMIT ?1`
  )
    .bind(LEADERBOARD_LIMIT)
    .all();

  const rows = best.results;
  if (rows.length === 0) return [];

  // One query for every run on the board, then bucket by run_id. The
  // alternative — a query per row — is 50 round trips to say the same thing.
  const placeholders = rows.map((_, i) => `?${i + 1}`).join(',');
  const levels = await env.DB.prepare(
    `SELECT run_id, level, match_score, passed
       FROM run_levels WHERE run_id IN (${placeholders})
      ORDER BY run_id, level`
  )
    .bind(...rows.map((r) => r.run_id))
    .all();

  const byRun = new Map();
  for (const row of levels.results) {
    if (!byRun.has(row.run_id)) byRun.set(row.run_id, []);
    byRun.get(row.run_id).push({ matchScore: row.match_score, passed: !!row.passed });
  }

  return rows.map((r) => ({
    name: r.username,
    score: r.total_score,
    maxLevel: r.max_level,
    easyMode: !!r.easy_mode,
    finished: !!r.finished,
    miniScores: (byRun.get(r.run_id) || []).slice(-MINI_SCORE_COUNT),
  }));
}

/* --------------------------------------------------------------- handlers */

async function handleRegister(request, env) {
  const { username, password } = await request.json().catch(() => ({}));
  if (!validUsername(username)) return fail('用户名需为 1-16 个非空白字符');
  if (typeof password !== 'string' || password.length < 6) return fail('密码至少 6 位');
  if (password.length > 128) return fail('密码过长');

  const salt = randomBase64(16);
  const hash = await hashPassword(password, salt);

  let user;
  try {
    user = await env.DB.prepare(
      `INSERT INTO users (username, pw_hash, pw_salt, created_at)
       VALUES (?1, ?2, ?3, ?4) RETURNING *`
    )
      .bind(username, hash, salt, Date.now())
      .first();
  } catch (err) {
    if (String(err).includes('UNIQUE')) return fail('用户名已被占用', 409);
    throw err;
  }

  const token = await createSession(env, user.id);
  return json(await userPayload(env, user), 200, {
    'set-cookie': sessionCookie(token, SESSION_TTL_MS / 1000),
  });
}

async function handleLogin(request, env) {
  const { username, password } = await request.json().catch(() => ({}));
  if (typeof username !== 'string' || typeof password !== 'string') return fail('参数不完整');

  const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?1').bind(username).first();
  // Hash even when the user does not exist, so a missing account and a wrong
  // password take the same amount of time and return the same message.
  const salt = user ? user.pw_salt : randomBase64(16);
  const hash = await hashPassword(password, salt);
  if (!user || !safeEqual(hash, user.pw_hash)) return fail('用户名或密码错误', 401);

  const token = await createSession(env, user.id);
  return json(await userPayload(env, user), 200, {
    'set-cookie': sessionCookie(token, SESSION_TTL_MS / 1000),
  });
}

async function handleLogout(request, env) {
  const token = readCookie(request, COOKIE_NAME);
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token = ?1').bind(token).run();
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie('', 0) });
}

async function handleSettings(request, env, user) {
  const body = await request.json().catch(() => ({}));
  await env.DB.prepare(
    `UPDATE users SET easy_mode = ?2, easy_mode_auto_set = ?3,
            has_played_before = ?4, got_noi_medal = ?5
      WHERE id = ?1`
  )
    .bind(
      user.id,
      body.easyMode ? 1 : 0,
      body.easyModeAutoSet ? 1 : 0,
      body.hasPlayedBefore ? 1 : 0,
      body.everGotNOIMedal ? 1 : 0
    )
    .run();
  return json({ ok: true });
}

async function handleRunStart(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const now = Date.now();
  const run = await env.DB.prepare(
    `INSERT INTO runs (user_id, started_at, updated_at, easy_mode, challenges)
     VALUES (?1, ?2, ?2, ?3, ?4) RETURNING id`
  )
    .bind(user.id, now, body.easyMode ? 1 : 0, JSON.stringify(body.challenges || {}))
    .first();
  return json({ runId: run.id });
}

/** Owns the run or gets nothing — a run id from another account is a 404. */
async function ownedRun(env, user, runId) {
  const id = Math.trunc(Number(runId));
  if (!Number.isFinite(id)) return null;
  return await env.DB.prepare('SELECT * FROM runs WHERE id = ?1 AND user_id = ?2')
    .bind(id, user.id)
    .first();
}

async function handleRunLevel(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const run = await ownedRun(env, user, body.runId);
  if (!run) return fail('对局不存在', 404);
  if (run.finished) return fail('对局已结束', 409);

  // Out-of-range values are rejected outright rather than clamped: clamping a
  // forged score to the ceiling would hand the forger the ceiling.
  const level = Math.trunc(Number(body.level ?? -1));
  const matchScore = Math.trunc(Number(body.matchScore ?? 0));
  const totalScore = Math.trunc(Number(body.totalScore ?? 0));
  if (!(level >= 0 && level <= MAX_LEVEL)) return fail('关卡非法', 400);
  if (!(matchScore >= 0 && matchScore <= MAX_MATCH_SCORE)) return fail('单场分数非法', 400);
  if (!(totalScore >= 0 && totalScore <= MAX_TOTAL_SCORE)) return fail('总分非法', 400);
  // Levels arrive in order or not at all. Re-recording the current level is
  // allowed (the client does that when a score is corrected); jumping ahead is
  // not, which is what a replayed or forged request would have to do.
  if (level > run.max_level + 1) return fail('关卡顺序非法', 400);

  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO run_levels (run_id, level, match_name, match_score, passed, sim, total_score, recorded_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
       ON CONFLICT(run_id, level) DO UPDATE SET
         match_name = excluded.match_name, match_score = excluded.match_score,
         passed = excluded.passed, sim = excluded.sim,
         total_score = excluded.total_score, recorded_at = excluded.recorded_at`
    ).bind(
      run.id,
      level,
      String(body.matchName || '').slice(0, 32),
      matchScore,
      body.passed ? 1 : 0,
      body.sim ? 1 : 0,
      totalScore,
      now
    ),
    env.DB.prepare(
      `UPDATE runs SET total_score = ?2, max_level = MAX(max_level, ?3), updated_at = ?4
        WHERE id = ?1`
    ).bind(run.id, totalScore, level, now),
    // Recomputed rather than compared-and-raised, because the client can also
    // lower a run's score (the anti-cheat key zeroes it) and a high-water mark
    // would happily keep pointing at a total that no longer exists.
    env.DB.prepare(
      `UPDATE users SET best_run_id = (
         SELECT id FROM runs WHERE user_id = ?1
          ORDER BY total_score DESC, max_level DESC, id ASC LIMIT 1
       ) WHERE id = ?1`
    ).bind(user.id),
  ]);

  return json({ ok: true });
}

async function handleRunFinish(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const run = await ownedRun(env, user, body.runId);
  if (!run) return fail('对局不存在', 404);
  await env.DB.prepare('UPDATE runs SET finished = 1, updated_at = ?2 WHERE id = ?1')
    .bind(run.id, Date.now())
    .run();
  return json({ ok: true });
}

async function handleAchievement(request, env, user) {
  const body = await request.json().catch(() => ({}));
  const mode = MODES.includes(body.mode) ? body.mode : null;
  const achId = typeof body.achId === 'string' ? body.achId.slice(0, 64) : '';
  if (!mode || !achId) return fail('参数非法');

  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO achievements (user_id, mode, ach_id, unlocked_at)
       VALUES (?1, ?2, ?3, ?4)`
    ).bind(user.id, mode, achId, now),
    env.DB.prepare(
      `INSERT OR IGNORE INTO achievement_firsts (mode, ach_id, user_id, unlocked_at)
       VALUES (?1, ?2, ?3, ?4)`
    ).bind(mode, achId, user.id, now),
  ]);

  const first = await env.DB.prepare(
    `SELECT u.username FROM achievement_firsts f JOIN users u ON u.id = f.user_id
      WHERE f.mode = ?1 AND f.ach_id = ?2`
  )
    .bind(mode, achId)
    .first();

  return json({ ok: true, firstPlayer: first ? first.username : user.username });
}

async function handleExport(env, user) {
  const [runs, levels, achs] = await Promise.all([
    env.DB.prepare('SELECT * FROM runs WHERE user_id = ?1 ORDER BY id').bind(user.id).all(),
    env.DB.prepare(
      `SELECT l.* FROM run_levels l JOIN runs r ON r.id = l.run_id
        WHERE r.user_id = ?1 ORDER BY l.run_id, l.level`
    )
      .bind(user.id)
      .all(),
    env.DB.prepare('SELECT mode, ach_id, unlocked_at FROM achievements WHERE user_id = ?1')
      .bind(user.id)
      .all(),
  ]);

  return json({
    username: user.username,
    exportedAt: Date.now(),
    runs: runs.results,
    runLevels: levels.results,
    achievements: achs.results,
  });
}

/* ----------------------------------------------------------------- router */

const ROUTES = {
  'POST /api/register': { auth: false, run: (req, env) => handleRegister(req, env) },
  'POST /api/login': { auth: false, run: (req, env) => handleLogin(req, env) },
  'POST /api/logout': { auth: false, run: (req, env) => handleLogout(req, env) },
  'GET /api/leaderboard': { auth: false, run: async (req, env) => json({ players: await leaderboard(env) }) },
  'GET /api/me': { auth: true, run: async (req, env, user) => json(await userPayload(env, user)) },
  'POST /api/settings': { auth: true, run: handleSettings },
  'POST /api/run/start': { auth: true, run: handleRunStart },
  'POST /api/run/level': { auth: true, run: handleRunLevel },
  'POST /api/run/finish': { auth: true, run: handleRunFinish },
  'POST /api/achievement': { auth: true, run: handleAchievement },
  'GET /api/export': { auth: true, run: (req, env, user) => handleExport(env, user) },
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    const route = ROUTES[`${request.method} ${url.pathname}`];
    if (!route) return fail('接口不存在', 404);

    try {
      if (!route.auth) return await route.run(request, env, null);

      const user = await currentUser(request, env);
      if (!user) return fail('未登录', 401);
      return await route.run(request, env, user);
    } catch (err) {
      console.error(`${request.method} ${url.pathname} failed`, err);
      return fail('服务器错误', 500);
    }
  },
};
