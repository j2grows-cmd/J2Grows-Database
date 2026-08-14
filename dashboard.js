// J2Grows Command Centre — premium workspace dashboard
(function(){
  const money=x=>'£'+Number(x||0).toFixed(2);
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const workspaceName=()=>document.querySelector('.brand > div:nth-child(2) b')?.textContent?.trim() || 'Your Workspace';

  window.dashboard=function(){
    const all=Array.isArray(plants)?plants:[];
    const sold=Array.isArray(sales)?sales:[];
    const saleStock=all.filter(p=>p.ownership_type==='Sale'&&p.status!=='Sold');
    const personal=all.filter(p=>p.ownership_type==='Personal');
    const revenue=sold.reduce((a,s)=>a+Number(s.sale_price||0),0);
    const profit=sold.reduce((a,s)=>a+Number(s.sale_price||0)-Number(s.cost||0)-Number(s.platform_fee||0)-Number(s.postage_cost||0)-Number(s.packaging_cost||0)-Number(s.other_cost||0),0);
    const stockValue=saleStock.reduce((a,p)=>a+Number(p.sale_price||0),0);
    const recent=sold.slice().sort((a,b)=>String(b.sale_date||'').localeCompare(String(a.sale_date||''))).slice(0,5);
    const health={Healthy:all.filter(p=>p.health==='Healthy').length,Attention:all.filter(p=>p.health==='Needs attention').length,Recovering:all.filter(p=>p.health==='Recovering').length,Quarantine:all.filter(p=>p.health==='Quarantine').length};
    const stages=['Acquired','Growing','Propagated','For Sale','Reserved','Sold'].map(s=>({s,n:all.filter(p=>(p.lifecycle_stage||p.status)===s).length}));
    const main=document.getElementById('main');
    main.innerHTML=`
      <style>
        .dash-hero{position:relative;overflow:hidden;padding:28px;border:1px solid #315c3b;border-radius:22px;background:radial-gradient(600px 220px at 90% -20%,#2b7b4670,transparent 65%),linear-gradient(135deg,#10251a,#09170f);margin-bottom:16px;box-shadow:0 22px 70px #0006}
        .dash-hero:after{content:'🌿';position:absolute;right:28px;bottom:-24px;font-size:130px;opacity:.08;transform:rotate(-12deg)}
        .dash-ey{color:#6df08e;font-size:10px;font-weight:950;letter-spacing:.2em}.dash-title{font-size:clamp(30px,4vw,46px);font-weight:950;margin:6px 0}.dash-sub{color:#9db2a3;max-width:680px;line-height:1.6}.dash-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.dash-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.dash-metric{position:relative;overflow:hidden}.dash-metric .trend{font-size:11px;color:#6df08e;margin-top:8px}.dash-grid2{display:grid;grid-template-columns:1.4fr 1fr;gap:12px;margin-bottom:16px}.dash-panel{padding:18px;border:1px solid #274c32;border-radius:18px;background:linear-gradient(180deg,#10251aee,#0a1710ee);box-shadow:0 18px 60px #0005}.dash-panel h3{margin:0 0 5px;font-size:15px}.dash-panel .sub{margin-bottom:15px}.stage-row{display:grid;grid-template-columns:90px 1fr 40px;gap:10px;align-items:center;margin:13px 0;font-size:12px}.stage-bar{height:8px;border-radius:999px;background:#07120b;overflow:hidden;border:1px solid #193322}.stage-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#55db79,#aaffb9)}.health-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.health-item{padding:13px;border:1px solid #193322;border-radius:13px;background:#0b1911}.health-item b{display:block;font-size:20px}.health-item span{font-size:10px;color:#8fa797;text-transform:uppercase;letter-spacing:.08em}.dash-list{display:grid;gap:8px}.dash-list-item{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px;border-bottom:1px solid #193322}.dash-list-item:last-child{border-bottom:0}.dash-list-item small{display:block;color:#8fa797;margin-top:3px}.dash-empty{padding:28px 8px;text-align:center;color:#8fa797}.dash-kicker{font-size:10px;color:#8fa797;text-transform:uppercase;letter-spacing:.1em}.dash-value{font-size:29px;font-weight:950;margin-top:5px}@media(max-width:1000px){.dash-grid{grid-template-columns:repeat(2,1fr)}.dash-grid2{grid-template-columns:1fr}}@media(max-width:560px){.dash-grid{grid-template-columns:1fr}.dash-hero{padding:22px}.stage-row{grid-template-columns:78px 1fr 30px}}
      </style>
      <section class="dash-hero"><div class="dash-ey">J2GROWS COMMAND CENTRE</div><div class="dash-title">Welcome to ${esc(workspaceName())}</div><div class="dash-sub">Your plant collection, propagation pipeline and sales activity — all in one place. Here’s the current state of your operation.</div><div class="dash-actions"><button class="btn primary" onclick="formPlant()">＋ Add Plant</button><button class="btn" onclick="nav('collection')">🌿 View Collection</button><button class="btn" onclick="nav('sales')">£ View Sales</button></div></section>
      <div class="dash-grid">
        <div class="card dash-metric"><div class="dash-kicker">Total Plants</div><div class="dash-value">${all.length}</div><div class="trend">${personal.length} personal · ${saleStock.length} sale stock</div></div>
        <div class="card dash-metric"><div class="dash-kicker">Sale Inventory</div><div class="dash-value" style="color:#f0cf72">${money(stockValue)}</div><div class="trend">${saleStock.length} active plants</div></div>
        <div class="card dash-metric"><div class="dash-kicker">Revenue</div><div class="dash-value">${money(revenue)}</div><div class="trend">${sold.length} completed sale${sold.length===1?'':'s'}</div></div>
        <div class="card dash-metric"><div class="dash-kicker">Net Profit</div><div class="dash-value" style="color:#71bdff">${money(profit)}</div><div class="trend">After recorded costs</div></div>
      </div>
      <div class="dash-grid2">
        <section class="dash-panel"><h3>Plant lifecycle</h3><div class="sub">See where your plants are in their journey.</div>${stages.map(x=>{const pct=all.length?Math.round(x.n/all.length*100):0;return `<div class="stage-row"><span>${x.s}</span><div class="stage-bar"><div class="stage-fill" style="width:${pct}%"></div></div><b>${x.n}</b></div>`}).join('')}</section>
        <section class="dash-panel"><h3>Plant health</h3><div class="sub">Quick health overview.</div><div class="health-grid">${Object.entries(health).map(([k,v])=>`<div class="health-item"><b>${v}</b><span>${k}</span></div>`).join('')}</div></section>
      </div>
      <div class="dash-grid2">
        <section class="dash-panel"><h3>Recent sales</h3><div class="sub">Your latest completed transactions.</div>${recent.length?`<div class="dash-list">${recent.map(s=>`<div class="dash-list-item"><div><b>${esc(s.plant_name||'Plant')}</b><small>${esc(s.sale_date||'Date not recorded')} · ${esc(s.channel||'Direct')}</small></div><b>${money(s.sale_price)}</b></div>`).join('')}</div>`:`<div class="dash-empty">No sales recorded yet.<br><button class="btn" style="margin-top:12px" onclick="nav('collection')">View sale stock</button></div>`}</section>
        <section class="dash-panel"><h3>Quick actions</h3><div class="sub">Jump straight to the things you use most.</div><div class="dash-list"><button class="btn" onclick="formPlant()">＋ Add a plant</button><button class="btn" onclick="nav('collection');setFilter('Sale')">£ Manage sale stock</button><button class="btn" onclick="nav('prop')">✂ Open propagation</button><button class="btn" onclick="nav('sales')">▣ Open sales</button></div></section>
      </div>`;
  };
})();
