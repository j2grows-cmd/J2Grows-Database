/* J2Grows Command Centre — account gate */
/* Authenticated workspace release: 2026-08-14 */
(function () {
  const SUPABASE_URL = 'https://izsjxfigndqkuarooequ.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_l7YUVUI649sClf3h2_KH-Q_EHPO-ffR';
  const REST_PREFIX = SUPABASE_URL + '/rest/v1/';

  if (!window.supabase) {
    document.write('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"><\\/script>');
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  let session = null;
  let profile = null;
  let resolveReady;
  const authReady = new Promise(resolve => { resolveReady = resolve; });
  let readyResolved = false;

  const style = document.createElement('style');
  style.textContent = `
    #auth-gate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:24px;background:radial-gradient(900px 600px at 80% -10%,#1b5a3066,transparent 65%),#06100a;color:#f4faf5;font-family:Inter,system-ui,sans-serif}
    #auth-gate[hidden]{display:none}
    .auth-shell{width:min(470px,100%);padding:34px;border:1px solid #315c3b;border-radius:28px;background:linear-gradient(180deg,#10251af7,#07120cf7);box-shadow:0 40px 120px #000c}
    .auth-brand{display:flex;align-items:center;gap:13px;margin-bottom:28px}.auth-logo{width:48px;height:48px;display:grid;place-items:center;border-radius:15px;background:linear-gradient(145deg,#caffd2,#4ad978);font-size:24px}.auth-brand b{font-size:20px;font-weight:950}.auth-brand small{display:block;color:#71917d;font-size:9px;letter-spacing:.2em;margin-top:2px}
    .auth-ey{color:#6df08e;font-size:10px;font-weight:950;letter-spacing:.18em}.auth-title{font-size:31px;font-weight:950;margin:5px 0 8px}.auth-sub{color:#8fa797;line-height:1.5;margin-bottom:22px}
    .auth-tabs{display:flex;gap:7px;margin-bottom:18px}.auth-tab{flex:1;border:1px solid #274c32;background:#0b1810;color:#8fa797;padding:11px;border-radius:11px;font-weight:900;cursor:pointer}.auth-tab.active{background:#6df08e;color:#06210b;border-color:#6df08e}
    .auth-field{display:grid;gap:6px;margin:12px 0}.auth-field label{font-size:10px;color:#8fa797;font-weight:900;text-transform:uppercase;letter-spacing:.1em}.auth-input{width:100%;background:#07120b;color:#fff;border:1px solid #274c32;padding:13px;border-radius:11px;outline:none}.auth-input:focus{border-color:#6df08e;box-shadow:0 0 0 3px #6df08e18}.auth-button{width:100%;border:0;background:linear-gradient(135deg,#aaffb9,#55db79);color:#05210b;padding:13px;border-radius:11px;font-weight:950;cursor:pointer;margin-top:8px}.auth-button:disabled{opacity:.55;cursor:wait}.auth-error{min-height:18px;color:#ff8178;font-size:12px;margin-top:10px}.auth-foot{color:#607668;font-size:10px;line-height:1.5;margin-top:18px}.account-chip{position:absolute;right:18px;bottom:18px;left:18px;border:1px solid #274c32;border-radius:12px;padding:10px;background:#0b1810;color:#8fa797;font-size:11px}.account-chip button{float:right;border:0;background:transparent;color:#ffaaa4;cursor:pointer;font-weight:900}
  `;
  document.head.appendChild(style);

  const gate = document.createElement('div');
  gate.id = 'auth-gate';
  gate.innerHTML = `
    <div class="auth-shell">
      <div class="auth-brand"><div class="auth-logo">🌱</div><div><b>J2GROWS</b><small>COMMAND CENTRE</small></div></div>
      <div class="auth-ey">YOUR PRIVATE WORKSPACE</div>
      <div class="auth-title" id="auth-title">Create your database</div>
      <div class="auth-sub" id="auth-sub">Create an account and give your plant database a name. That name will become the identity of your Command Centre.</div>
      <div class="auth-tabs"><button class="auth-tab active" id="auth-signup-tab">Create account</button><button class="auth-tab" id="auth-login-tab">Sign in</button></div>
      <form id="auth-form">
        <div class="auth-field" id="db-field"><label for="db-name">Database name</label><input class="auth-input" id="db-name" autocomplete="organization" placeholder="e.g. Joe's Plant Database" maxlength="60"></div>
        <div class="auth-field"><label for="auth-email">Email</label><input class="auth-input" id="auth-email" type="email" autocomplete="email" required placeholder="you@example.com"></div>
        <div class="auth-field"><label for="auth-password">Password</label><input class="auth-input" id="auth-password" type="password" autocomplete="new-password" minlength="6" required placeholder="At least 6 characters"></div>
        <button class="auth-button" id="auth-submit" type="submit">Create my database</button>
        <div class="auth-error" id="auth-error"></div>
      </form>
      <div class="auth-foot">Your plants and sales are tied to your account. Other users cannot access your private workspace.</div>
    </div>`;
  document.body.appendChild(gate);

  const form = document.getElementById('auth-form');
  const signupTab = document.getElementById('auth-signup-tab');
  const loginTab = document.getElementById('auth-login-tab');
  const dbField = document.getElementById('db-field');
  const dbName = document.getElementById('db-name');
  const email = document.getElementById('auth-email');
  const password = document.getElementById('auth-password');
  const submit = document.getElementById('auth-submit');
  const errorBox = document.getElementById('auth-error');
  const title = document.getElementById('auth-title');
  const sub = document.getElementById('auth-sub');
  let mode = 'signup';

  function setMode(next) {
    mode = next;
    const signup = mode === 'signup';
    signupTab.classList.toggle('active', signup);
    loginTab.classList.toggle('active', !signup);
    dbField.style.display = signup ? '' : 'none';
    title.textContent = signup ? 'Create your database' : 'Welcome back';
    sub.textContent = signup ? 'Create an account and give your plant database a name. That name will become the identity of your Command Centre.' : 'Sign in to open your private plant database.';
    submit.textContent = signup ? 'Create my database' : 'Sign in';
    password.autocomplete = signup ? 'new-password' : 'current-password';
    errorBox.textContent = '';
  }
  signupTab.onclick = () => setMode('signup');
  loginTab.onclick = () => setMode('login');

  function showGate() { gate.hidden = false; }
  function hideGate() { gate.hidden = true; }
  function resolveWhenReady() {
    if (!readyResolved && session) { readyResolved = true; resolveReady(); }
  }

  async function loadProfile() {
    if (!session) return null;
    const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (error) throw error;
    profile = data;
    return data;
  }

  function applyDatabaseBrand() {
    const name = (profile && profile.database_name || '').trim();
    if (!name) return;
    document.title = name + ' · J2Grows Command Centre';
    const brand = document.querySelector('.brand > div:nth-child(2)');
    if (brand) brand.innerHTML = '<b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:175px">' + escapeHtml(name) + '</b><small>J2GROWS COMMAND CENTRE</small>';
    let chip = document.getElementById('account-chip');
    if (!chip) {
      chip = document.createElement('div');
      chip.id = 'account-chip';
      chip.className = 'account-chip';
      const side = document.querySelector('.side');
      if (side) side.appendChild(chip);
    }
    chip.innerHTML = '<span>Signed in · <b>' + escapeHtml(session.user.email || '') + '</b><br><span style="color:#6df08e">' + escapeHtml(name) + '</span></span><button type="button">SIGN OUT</button>';
    chip.querySelector('button').onclick = async () => { await sb.auth.signOut(); location.reload(); };
  }

  function escapeHtml(v) { return String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  async function ensureDatabaseName() {
    if (profile && profile.database_name && profile.database_name.trim()) return true;
    const name = window.prompt('Name your plant database', 'My Plant Database');
    if (!name || !name.trim()) return false;
    const { data, error } = await sb.from('profiles').upsert({ id: session.user.id, database_name: name.trim(), updated_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    profile = data;
    return true;
  }

  form.onsubmit = async (event) => {
    event.preventDefault();
    errorBox.textContent = '';
    submit.disabled = true;
    try {
      if (mode === 'signup') {
        const databaseName = dbName.value.trim();
        const signupEmail = email.value.trim();
        if (!databaseName) throw new Error('Please give your database a name.');
        if (!signupEmail) throw new Error('Please enter your email address.');

        const { data, error } = await sb.auth.signUp({
          email: signupEmail,
          password: password.value,
          options: {
            data: { database_name: databaseName },
            emailRedirectTo: window.location.origin + window.location.pathname
          }
        });
        if (error) throw error;

        session = data.session;
        if (!session) {
          setMode('login');
          email.value = signupEmail;
          password.value = '';
          errorBox.style.color = '#f0cf72';
          errorBox.textContent = 'Account created. Check your email and click the confirmation link. You will then be signed in automatically.';
          return;
        }

        errorBox.style.color = '';
        await loadProfile();
        if (!profile || !profile.database_name) {
          const { data: saved, error: saveError } = await sb.from('profiles').upsert({
            id: session.user.id,
            database_name: databaseName,
            updated_at: new Date().toISOString()
          }).select().single();
          if (saveError) throw saveError;
          profile = saved;
        }
        hideGate();
        applyDatabaseBrand();
        resolveWhenReady();
      } else {
        const { data, error } = await sb.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
        if (error) throw error;
        session = data.session;
        errorBox.style.color = '';
        await loadProfile();
        if (!(await ensureDatabaseName())) throw new Error('A database name is required to continue.');
        applyDatabaseBrand();
        hideGate();
        resolveWhenReady();
      }
    } catch (err) {
      errorBox.style.color = '';
      errorBox.textContent = err.message || 'Unable to authenticate.';
    } finally {
      submit.disabled = false;
    }
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input && input.url;
    if (!url || !url.startsWith(REST_PREFIX)) return originalFetch(input, init);
    await authReady;
    if (!session) return new Response(JSON.stringify({ message: 'Authentication required' }), { status: 401, headers: {'Content-Type':'application/json'} });
    const nextInit = { ...(init || {}) };
    const headers = new Headers(nextInit.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('apikey', SUPABASE_KEY);
    headers.set('Authorization', 'Bearer ' + session.access_token);
    headers.set('Content-Type', 'application/json');
    nextInit.headers = headers;
    const method = (nextInit.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const resource = url.slice(REST_PREFIX.length).split('?')[0].split('/')[0];
    if (method === 'POST' && (resource === 'plants' || resource === 'sales') && nextInit.body) {
      try {
        const body = JSON.parse(nextInit.body);
        if (Array.isArray(body)) body.forEach(row => { if (!row.user_id) row.user_id = session.user.id; });
        else if (body && !body.user_id) body.user_id = session.user.id;
        nextInit.body = JSON.stringify(body);
      } catch (_) {}
    }
    return originalFetch(input, nextInit);
  };

  sb.auth.getSession().then(async ({ data }) => {
    session = data.session;
    if (session) {
      try {
        await loadProfile();
        if (!(await ensureDatabaseName())) { await sb.auth.signOut(); location.reload(); return; }
        applyDatabaseBrand();
        hideGate();
        resolveWhenReady();
      } catch (err) {
        showGate();
        errorBox.textContent = err.message || 'Unable to load your database.';
      }
    } else showGate();
  });

  sb.auth.onAuthStateChange(async (_event, nextSession) => {
    session = nextSession;
    if (session) {
      try { await loadProfile(); applyDatabaseBrand(); hideGate(); resolveWhenReady(); } catch (_) { showGate(); }
    } else showGate();
  });
})();
