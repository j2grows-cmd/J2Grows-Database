/* J2Grows Command Centre — workspace settings */
(function () {
  const URL = 'https://izsjxfigndqkuarooequ.supabase.co';
  const KEY = 'sb_publishable_l7YUVUI649sClf3h2_KH-Q_EHPO-ffR';
  const sb = window.supabase?.createClient(URL, KEY);
  if (!sb) return;

  const style = document.createElement('style');
  style.textContent = `
    .ws-overlay{position:fixed;inset:0;z-index:50000;display:grid;place-items:center;padding:24px;background:#000b;backdrop-filter:blur(9px)}
    .ws-overlay[hidden]{display:none}.ws-box{width:min(680px,100%);max-height:90vh;overflow:auto;border:1px solid #315c3b;border-radius:24px;background:linear-gradient(180deg,#10251a,#07120c);box-shadow:0 40px 120px #000c;padding:28px;color:#f4faf5;font-family:Inter,system-ui,sans-serif}
    .ws-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:24px}.ws-ey{color:#6df08e;font-size:10px;font-weight:950;letter-spacing:.18em}.ws-title{font-size:28px;font-weight:950;margin:3px 0 6px}.ws-sub{color:#8fa797;line-height:1.5}.ws-close{width:40px;height:40px;border:1px solid #274c32;background:#0b1810;color:#fff;border-radius:10px;font-size:22px;cursor:pointer}
    .ws-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.ws-card{border:1px solid #274c32;border-radius:16px;background:#0b1911;padding:18px}.ws-full{grid-column:1/-1}.ws-label{font-size:10px;color:#8fa797;font-weight:900;text-transform:uppercase;letter-spacing:.1em}.ws-value{font-size:17px;font-weight:900;margin-top:7px;word-break:break-word}.ws-input{width:100%;margin-top:8px;background:#07120b;color:#fff;border:1px solid #274c32;padding:12px;border-radius:10px;outline:none}.ws-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:18px;flex-wrap:wrap}.ws-btn{border:1px solid #274c32;background:#0b1810;color:#fff;padding:10px 13px;border-radius:10px;font-weight:900;cursor:pointer}.ws-primary{border:0;background:linear-gradient(135deg,#aaffb9,#55db79);color:#05210b}.ws-danger{color:#ffaaa4}.ws-msg{min-height:18px;margin-top:9px;font-size:12px;color:#a9f2b7}.ws-error{color:#ff8178}
    @media(max-width:600px){.ws-grid{grid-template-columns:1fr}.ws-full{grid-column:auto}.ws-box{padding:20px}}
  `;
  document.head.appendChild(style);

  let session = null;
  let profile = null;
  const esc = v => String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  async function load() {
    const result = await sb.auth.getSession();
    session = result.data.session;
    if (!session) return;
    const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (!error) profile = data;
    installButton();
  }

  function installButton() {
    const nav = document.querySelector('.nav');
    if (!nav || document.getElementById('workspace-settings-nav')) return;
    const button = document.createElement('button');
    button.id = 'workspace-settings-nav'; button.type = 'button'; button.innerHTML = '⚙️ <span>Settings</span>'; button.onclick = open;
    nav.appendChild(button);
  }

  function open() {
    let overlay = document.getElementById('workspace-settings');
    if (!overlay) {
      overlay = document.createElement('div'); overlay.id = 'workspace-settings'; overlay.className = 'ws-overlay'; overlay.hidden = true;
      overlay.innerHTML = `<div class="ws-box"><div class="ws-head"><div><div class="ws-ey">WORKSPACE SETTINGS</div><div class="ws-title">Account & Database</div><div class="ws-sub">Manage the identity and security of your private Command Centre.</div></div><button class="ws-close" id="ws-close">×</button></div><div class="ws-grid"><div class="ws-card ws-full"><div class="ws-label">Database name</div><input id="ws-db" class="ws-input" maxlength="60" placeholder="Your database name"><div class="ws-actions"><button class="ws-btn ws-primary" id="ws-save">Save database name</button></div><div id="ws-db-msg" class="ws-msg"></div></div><div class="ws-card"><div class="ws-label">Signed-in email</div><div class="ws-value" id="ws-email"></div></div><div class="ws-card"><div class="ws-label">Workspace status</div><div class="ws-value">🔒 Private</div></div><div class="ws-card ws-full"><div class="ws-label">Password</div><div class="ws-sub" style="margin-top:7px">Send a password-reset email to your signed-in address.</div><div class="ws-actions"><button class="ws-btn" id="ws-reset">Send password reset</button><button class="ws-btn ws-danger" id="ws-signout">Sign out</button></div><div id="ws-sec-msg" class="ws-msg"></div></div></div></div>`;
      document.body.appendChild(overlay);
      document.getElementById('ws-close').onclick = () => overlay.hidden = true;
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.hidden = true; });
      document.getElementById('ws-save').onclick = saveName;
      document.getElementById('ws-reset').onclick = resetPassword;
      document.getElementById('ws-signout').onclick = async () => { await sb.auth.signOut(); location.reload(); };
    }
    document.getElementById('ws-db').value = profile?.database_name || '';
    document.getElementById('ws-email').textContent = session?.user?.email || '';
    document.getElementById('ws-db-msg').textContent = ''; document.getElementById('ws-sec-msg').textContent = '';
    overlay.hidden = false;
  }

  async function saveName() {
    const input = document.getElementById('ws-db'); const msg = document.getElementById('ws-db-msg'); const name = input.value.trim();
    msg.className = 'ws-msg'; msg.textContent = '';
    if (!name) { msg.className += ' ws-error'; msg.textContent = 'Please enter a database name.'; return; }
    const btn = document.getElementById('ws-save'); btn.disabled = true;
    try {
      const { data, error } = await sb.from('profiles').upsert({ id: session.user.id, database_name: name, updated_at: new Date().toISOString() }).select().single();
      if (error) throw error;
      profile = data; document.title = name + ' · J2Grows Command Centre';
      const brand = document.querySelector('.brand > div:nth-child(2)');
      if (brand) brand.innerHTML = '<b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:175px">' + esc(name) + '</b><small>J2GROWS COMMAND CENTRE</small>';
      msg.textContent = 'Database name updated.';
    } catch (e) { msg.className += ' ws-error'; msg.textContent = e.message || 'Unable to update database name.'; }
    finally { btn.disabled = false; }
  }

  async function resetPassword() {
    const msg = document.getElementById('ws-sec-msg'); msg.className = 'ws-msg'; msg.textContent = '';
    try {
      const { error } = await sb.auth.resetPasswordForEmail(session.user.email, { redirectTo: window.location.origin + window.location.pathname });
      if (error) throw error; msg.textContent = 'Password reset email sent.';
    } catch (e) { msg.className += ' ws-error'; msg.textContent = e.message || 'Unable to send password reset email.'; }
  }

  const wait = setInterval(() => { if (document.querySelector('.nav')) { clearInterval(wait); load(); } }, 100);
  setTimeout(() => clearInterval(wait), 15000);
})();
// deployment trigger
