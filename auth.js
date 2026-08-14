/* J2Grows Command Centre — authenticated workspace gate */
(function () {
  const SUPABASE_URL = 'https://fikyexmwwvlggeosolfe.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_rIqVXBE087N83L4LKBHdSw_nhvj1XiG';
  const LEGACY_URL = 'https://izsjxfigndqkuarooequ.supabase.co';
  const NEW_REST = SUPABASE_URL + '/rest/v1/';
  const LEGACY_REST = LEGACY_URL + '/rest/v1/';

  // Install the REST bridge immediately. The old version waited for the
  // Supabase CDN script to load before installing fetch(), which meant the
  // app could fire its first database request before authentication existed.
  let session = null;
  let readyResolve;
  let readyResolved = false;
  const authReady = new Promise(resolve => { readyResolve = resolve; });
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function(input, init) {
    let url = typeof input === 'string' ? input : input?.url;
    if (!url || (!url.startsWith(LEGACY_REST) && !url.startsWith(NEW_REST))) {
      return originalFetch(input, init);
    }

    await authReady;
    if (!session) {
      return new Response(JSON.stringify({message:'Authentication required'}), {
        status: 401,
        headers: {'Content-Type':'application/json'}
      });
    }

    if (url.startsWith(LEGACY_REST)) {
      url = NEW_REST + url.slice(LEGACY_REST.length);
    }

    const next = {...(init || {})};
    const headers = new Headers(next.headers || (input instanceof Request ? input.headers : undefined));
    headers.set('apikey', SUPABASE_KEY);
    headers.set('Authorization', 'Bearer ' + session.access_token);
    headers.set('Content-Type', 'application/json');
    next.headers = headers;

    const method = (next.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const resource = url.slice(NEW_REST.length).split('?')[0].split('/')[0];
    const ownedResources = new Set(['plants','sales','propagations']);

    if (method === 'POST' && ownedResources.has(resource) && next.body) {
      try {
        const body = JSON.parse(next.body);
        if (Array.isArray(body)) {
          body.forEach(row => { if (row && !row.user_id) row.user_id = session.user.id; });
        } else if (body && !body.user_id) {
          body.user_id = session.user.id;
        }
        next.body = JSON.stringify(body);
      } catch (_) {}
    }

    if (typeof input === 'string') return originalFetch(url, next);
    return originalFetch(new Request(url, input), next);
  };

  function boot() {
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    let profile = null;

    const style = document.createElement('style');
    style.textContent = `
      #auth-gate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:24px;background:radial-gradient(900px 600px at 80% -10%,#1b5a3066,transparent 65%),#06100a;color:#f4faf5;font-family:Inter,system-ui,sans-serif}
      #auth-gate[hidden]{display:none}.auth-shell{width:min(470px,100%);padding:34px;border:1px solid #315c3b;border-radius:28px;background:linear-gradient(180deg,#10251af7,#07120cf7);box-shadow:0 40px 120px #000c}.auth-brand{display:flex;align-items:center;gap:13px;margin-bottom:28px}.auth-logo{width:48px;height:48px;display:grid;place-items:center;border-radius:15px;background:linear-gradient(145deg,#caffd2,#4ad978);font-size:24px}.auth-brand b{font-size:20px;font-weight:950}.auth-brand small{display:block;color:#71917d;font-size:9px;letter-spacing:.2em;margin-top:2px}.auth-ey{color:#6df08e;font-size:10px;font-weight:950;letter-spacing:.18em}.auth-title{font-size:31px;font-weight:950;margin:5px 0 8px}.auth-sub{color:#8fa797;line-height:1.5;margin-bottom:22px}.auth-tabs{display:flex;gap:7px;margin-bottom:18px}.auth-tab{flex:1;border:1px solid #274c32;background:#0b1810;color:#8fa797;padding:11px;border-radius:11px;font-weight:900;cursor:pointer}.auth-tab.active{background:#6df08e;color:#06210b;border-color:#6df08e}.auth-field{display:grid;gap:6px;margin:12px 0}.auth-field label{font-size:10px;color:#8fa797;font-weight:900;text-transform:uppercase;letter-spacing:.1em}.auth-input{width:100%;background:#07120b;color:#fff;border:1px solid #274c32;padding:13px;border-radius:11px;outline:none}.auth-input:focus{border-color:#6df08e;box-shadow:0 0 0 3px #6df08e18}.auth-button{width:100%;border:0;background:linear-gradient(135deg,#aaffb9,#55db79);color:#05210b;padding:13px;border-radius:11px;font-weight:950;cursor:pointer;margin-top:8px}.auth-button:disabled{opacity:.55;cursor:wait}.auth-error{min-height:18px;color:#ff8178;font-size:12px;margin-top:10px}.auth-foot{color:#607668;font-size:10px;line-height:1.5;margin-top:18px}
    `;
    document.head.appendChild(style);

    const gate = document.createElement('div');
    gate.id = 'auth-gate';
    gate.innerHTML = `<div class="auth-shell"><div class="auth-brand"><div class="auth-logo">🌱</div><div><b>J2GROWS</b><small>COMMAND CENTRE</small></div></div><div class="auth-ey">YOUR PRIVATE WORKSPACE</div><div class="auth-title" id="auth-title">Create your database</div><div class="auth-sub" id="auth-sub">Create an account and give your plant database a name.</div><div class="auth-tabs"><button type="button" class="auth-tab active" id="auth-signup-tab">Create account</button><button type="button" class="auth-tab" id="auth-login-tab">Sign in</button></div><form id="auth-form"><div class="auth-field" id="db-field"><label for="db-name">Database name</label><input class="auth-input" id="db-name" autocomplete="organization" placeholder="e.g. Joe's Plant Database" maxlength="60"></div><div class="auth-field"><label for="auth-email">Email</label><input class="auth-input" id="auth-email" type="email" autocomplete="email" required placeholder="you@example.com"></div><div class="auth-field"><label for="auth-password">Password</label><input class="auth-input" id="auth-password" type="password" autocomplete="new-password" minlength="6" required placeholder="At least 6 characters"></div><button class="auth-button" id="auth-submit" type="submit">Create my database</button><div class="auth-error" id="auth-error"></div></form><div class="auth-foot">Your plants and sales are tied to your account. Other users cannot access your private workspace.</div></div>`;
    document.body.appendChild(gate);

    const $ = id => document.getElementById(id);
    const form = $('auth-form'), signupTab = $('auth-signup-tab'), loginTab = $('auth-login-tab'), dbField = $('db-field'), dbName = $('db-name'), email = $('auth-email'), password = $('auth-password'), submit = $('auth-submit'), errorBox = $('auth-error'), title = $('auth-title'), sub = $('auth-sub');
    let mode = 'signup';
    const esc = v => String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    function setMode(next) {
      mode = next;
      const signup = mode === 'signup';
      signupTab.classList.toggle('active', signup);
      loginTab.classList.toggle('active', !signup);
      dbField.style.display = signup ? '' : 'none';
      title.textContent = signup ? 'Create your database' : 'Welcome back';
      sub.textContent = signup ? 'Create an account and give your plant database a name.' : 'Sign in to open your private plant database.';
      submit.textContent = signup ? 'Create my database' : 'Sign in';
      password.autocomplete = signup ? 'new-password' : 'current-password';
      errorBox.textContent = '';
      errorBox.style.color = '';
    }
    signupTab.onclick = () => setMode('signup');
    loginTab.onclick = () => setMode('login');

    async function loadProfile() {
      if (!session) return null;
      const {data,error} = await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
      if (error) throw error;
      profile = data;
      return data;
    }

    async function saveProfile(name) {
      const {data,error} = await sb.from('profiles').upsert({
        id: session.user.id,
        email: session.user.email,
        database_name: name,
        updated_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      profile = data;
      return data;
    }

    async function ensureDatabaseName() {
      const metadataName = session?.user?.user_metadata?.database_name;
      if (profile?.database_name?.trim()) return profile.database_name.trim();
      if (metadataName?.trim()) {
        try { await saveProfile(metadataName.trim()); } catch (_) {}
        return metadataName.trim();
      }
      return null;
    }

    function brand(name) {
      if (!name) return;
      document.title = name + ' · J2Grows Command Centre';
      const el = document.querySelector('.brand > div:nth-child(2)');
      if (el) el.innerHTML = '<b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:175px">' + esc(name) + '</b><small>J2GROWS COMMAND CENTRE</small>';
    }

    function markReady() {
      if (!readyResolved) {
        readyResolved = true;
        readyResolve();
      }
    }

    form.onsubmit = async e => {
      e.preventDefault();
      errorBox.textContent = '';
      submit.disabled = true;
      try {
        if (mode === 'signup') {
          const name = dbName.value.trim();
          const mail = email.value.trim();
          if (!name) throw Error('Please give your database a name.');
          const {data,error} = await sb.auth.signUp({
            email: mail,
            password: password.value,
            options: { data: { database_name: name }, emailRedirectTo: window.location.origin + window.location.pathname }
          });
          if (error) throw error;
          session = data.session;
          if (!session) {
            setMode('login');
            email.value = mail;
            password.value = '';
            errorBox.style.color = '#f0cf72';
            errorBox.textContent = 'Account created. Check your email to confirm the account, then sign in.';
            return;
          }
          try { await loadProfile(); } catch (_) { profile = null; }
          if (!profile?.database_name) {
            try { await saveProfile(name); } catch (_) {}
          }
          brand(name);
          gate.hidden = true;
        } else {
          const {data,error} = await sb.auth.signInWithPassword({email:email.value.trim(),password:password.value});
          if (error) throw error;
          session = data.session;
          await loadProfile();
          const name = await ensureDatabaseName();
          if (!name) throw Error('This account has no database name. Create a new account or contact support.');
          brand(name);
          gate.hidden = true;
        }
        markReady();
      } catch (err) {
        errorBox.style.color = '';
        errorBox.textContent = err.message || 'Unable to authenticate.';
      } finally {
        submit.disabled = false;
      }
    };

    sb.auth.getSession().then(async ({data}) => {
      session = data.session;
      if (session) {
        try {
          await loadProfile();
          const name = await ensureDatabaseName();
          if (name) {
            brand(name);
            gate.hidden = true;
          }
        } catch (err) {
          gate.hidden = false;
          errorBox.textContent = err.message || 'Unable to load your database.';
        }
      } else {
        gate.hidden = false;
      }
      markReady();
    }).catch(() => {
      gate.hidden = false;
      markReady();
    });

    sb.auth.onAuthStateChange((_event,next) => {
      session = next;
      if (!session) gate.hidden = false;
    });
  }

  if (window.supabase) {
    boot();
  } else {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    s.onload = boot;
    s.onerror = () => alert('Could not load authentication. Please check your connection and reload.');
    document.head.appendChild(s);
  }
})();