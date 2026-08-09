/* ============ 广东考情通 · 主控制器 / 布局 / 数据层 ============ */
window.App = (function(){
  const SESSION_KEY = 'gdkt_session_v1';
  let session = null;
  let loggedIn = false;

  /* 安全存储（隐私模式/禁用存储时兜底） */
  const store={
    get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
    set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
    del(k){ try{ localStorage.removeItem(k); }catch(e){} }
  };

  /* ---------- 数据层 ---------- */
  function normRegion(name){
    if(!name) return '';
    let s = String(name).replace(/地区$/,'').trim();
    // 匹配 REGIONS 别名
    const hit = (window.REGIONS||[]).find(r=>r.name===s || r.alias===s);
    return hit ? hit.name : s;
  }
  function classifyProject(raw){
    const rules = window.PROJECT_RULES||[];
    for(const r of rules){ if(r.kws.some(k=>String(raw).includes(k))) return r.id; }
    return 'bianwai';
  }
  function regionProjects(regionAlias){
    // 从真题库得出该地区有哪些项目
    const names = new Set(); const zt = window.ZHENTI;
    if(zt&&zt.regions){ const r = (zt.regions||[]).find(x=>normRegion(x.region)===regionAlias);
      if(r){ (r.projects||[]).forEach(p=>names.add(classifyProject(p.project))); } }
    // 若有统考/省考，省级记录都覆盖各地
    return [...names];
  }
  function allRecords(){
    const base = (window.KAOQING && window.KAOQING.records) ? KAOQING.records.slice() : [];
    const county = (window.COUNTY_KAOQING && Array.isArray(window.COUNTY_KAOQING)) ? COUNTY_KAOQING : [];
    if(session && session.records) return base.concat(county, session.records);
    return base.concat(county);
  }
  function saveSession(){ store.set(SESSION_KEY, JSON.stringify(session)); }
  function toast(msg,ms=2200){
    const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),ms);
  }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  /* ---------- 布局：左右分栏拖动 ---------- */
  function initSplit(){
    const div=document.getElementById('divider'), side=document.getElementById('side'), app=document.getElementById('app');
    const saved=store.get('gdkt_side_w');
    if(saved){ document.documentElement.style.setProperty('--sidebar-w', saved+'px'); }
    let dragging=false;
    div.addEventListener('mousedown', e=>{ dragging=true; div.style.background='var(--brand)'; e.preventDefault(); });
    document.addEventListener('mousemove', e=>{ if(!dragging) return;
      let w=e.clientX; w=Math.max(170, Math.min(520, w));
      document.documentElement.style.setProperty('--sidebar-w', w+'px');
    });
    document.addEventListener('mouseup', ()=>{
      if(!dragging) return; dragging=false; div.style.background='';
      const w=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-w'));
      store.set('gdkt_side_w', w);
    });
    // 触屏
    div.addEventListener('touchstart', e=>{ dragging=true; }, {passive:true});
    document.addEventListener('touchmove', e=>{ if(dragging){ let w=e.touches[0].clientX; w=Math.max(170,Math.min(520,w)); document.documentElement.style.setProperty('--sidebar-w',w+'px'); } }, {passive:true});
    document.addEventListener('touchend', ()=>{ dragging=false; });
  }

  function menuToggle(){
    const s=document.getElementById('side'), m=document.getElementById('sideMask');
    const open=!s.classList.contains('open');
    s.classList.toggle('open',open); m.classList.toggle('show',open);
  }

  /* ---------- 导航 ---------- */
  const TITLES={ overview:'广东考情总览', search:'地区考情查找', import:'考情导入', settings:'设置' };
  function nav(){
    document.querySelectorAll('.nav-item[data-view]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const v=btn.dataset.view;
        // 移动端点导航后收起侧栏
        document.getElementById('side').classList.remove('open');
        document.getElementById('sideMask').classList.remove('show');
        document.querySelectorAll('.view').forEach(s=>s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
        const target=document.getElementById('view-'+v);
        target.classList.add('active'); target.classList.remove('fade'); void target.offsetWidth; target.classList.add('fade');
        btn.classList.add('active');
        document.getElementById('pageTitle').textContent=TITLES[v]||v;
        if(btn.dataset.quick){ App.quick(btn.dataset.quick); }
        window.location.hash=v;
      });
    });
    // 初始化hash
    const h=(location.hash||'').replace('#','');
    if(h && document.getElementById('view-'+h)){ document.querySelector(`.nav-item[data-view="${h}"]`)?.click(); }
  }

  /* ---------- 快捷入口 ---------- */
  function quick(q){
    const s=document.getElementById('view-search');
    if(q==='zhenti'){
      document.getElementById('zhentiPanel').style.display='block';
      loadZhen(()=>Search.showZhentiQuick());
    }
    // 项目快捷 → 设置搜索并触发
    if(['shiye','jiao','yiliao'].includes(q)){
      document.getElementById('fRegion').value='';
      document.getElementById('fProject').value=q;
      document.getElementById('fYear').value='';
      document.getElementById('fArea').value=''; document.getElementById('fKw').value='';
      Search.run();
    }
  }

  /* ---------- 真题索引懒加载（zhenti.js ~1.2MB，进入真题面板才注入） ---------- */
  function loadZhen(cb){
    if(window.ZHENTI){ if(cb) cb(); return; }
    const s=document.createElement('script');
    s.src='data/zhenti.js';
    s.onload=()=>{ if(cb) cb(); }; s.onerror=()=>{ if(cb) cb(); };
    document.head.appendChild(s);
  }

  /* ---------- 统计概览 ---------- */
  function stats(){
    const zt=window.ZHENTI; let folders=0, files=0;
    if(zt&&zt.regions){ zt.regions.forEach(r=>{ (r.projects||[]).forEach(p=>{ (p.sources||[]).forEach(x=>{ folders++; files+=x.fileCount||0; }); }); }); }
    document.getElementById('statCity').textContent=(zt&&zt.regions?zt.regions.length:22)+' 个地市';
    const all = allRecords();
    document.getElementById('statKq').textContent=all.length+' 条';
    document.getElementById('statZt').textContent=folders;
    document.getElementById('statZtF').textContent=files;
    // 县区覆盖：记录中 area 触及的县区数
    const recs=allRecords();
    const areaSet=new Set(recs.filter(r=>r.area).map(r=>r.region.replace(/地区$/,'')+':'+r.area));
    const cov=document.getElementById('statArea');
    if(cov){ cov.textContent=areaSet.size+' 个县区'; }
    document.getElementById('dataBadge').textContent='数据更新至 '+(SETTINGS.updatedAt||'-');
  }

  /* ---------- 导出 / 登录 ---------- */
  function download(filename, text, mime){
    const blob=new Blob([text],{type:mime||'application/octet-stream'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename;
    document.body.appendChild(a); a.click(); URL.revokeObjectURL(a.href); a.remove();
  }
  function exportAll(){
    const out={ app:'广东考情通', exportedAt:new Date().toISOString().slice(0,10), settings:window.SETTINGS, kaoqing:allRecords() };
    download('kaoqing_导出.json', JSON.stringify(out,null,2), 'application/json');
    toast('已导出 kaoqing_导出.json');
  }
  function login(){
    const pwd=document.getElementById('adminPwd').value;
    const ok= pwd && (pwd=== (SETTINGS.adminPassword||'admin123') || pwd=== (session&&session.adminPassword||''));
    if(ok){ loggedIn=true; document.getElementById('importArea').style.opacity=1; document.getElementById('importArea').style.pointerEvents='';
      document.getElementById('loginMsg').textContent='✔ 验证通过，可编辑（本机会话）'; toast('验证通过'); }
    else{ document.getElementById('loginMsg').textContent='✘ 口令错误'; }
  }
  function changePwd(){
    const np=document.getElementById('setNewPwd').value;
    if(!np){ toast('请输入新口令'); return; }
    if(session===null) session={}; session.adminPassword=np; saveSession();
    SETTINGS.adminPassword=np;
    toast('口令已更新(本会话)'); document.getElementById('setNewPwd').value='';
  }
  function resetLocal(){ if(!confirm('确定恢复默认并清除本次会话的数据改动吗？'))return; store.del(SESSION_KEY); session=null; loggedIn=false; location.reload(); }

  /* ---------- 详情弹窗 ---------- */
  function showDetail(rec){
    document.getElementById('dTitle').textContent = `${rec.region||''} · ${rec.title||rec.project||''}`;
    document.getElementById('dBody').innerHTML = detailHTML(rec);
    // 加"复制文本"按钮（生成可发给学员的纯文本简报）
    const dt=document.createElement('div');
    dt.style.marginTop='12px'; dt.style.display='flex'; dt.style.gap='8px';
    const cb=document.createElement('button'); cb.className='btn primary'; cb.textContent='📋 复制考情文本';
    cb.onclick=()=>{
      const dd=rec.detail||{};
      const get=(en,cn)=>dd[en]||dd[cn];
      const lines=[`【${rec.title||rec.project}】`,
        `地区：${rec.region||''}${rec.area?' · '+rec.area:''}`,
        `年份：${rec.year||'-'}`, `可信度：${plainSource(rec)}`, `更新：${rec.updatedAt||'-'}`, '',
        `${rec.summary||''}`, '',
        ...Object.entries({科目:get('dui','科目'),题型:get('duan','题型'),时长题量:get('shou','时长题量'),招考时间规律:get('shijian','时间规律'),要求:get('yao','要求'),竞争难度进面:get('jingz','竞争难度'),待遇性价比:get('daiyu','待遇'),真题说明:get('zhenti','真题')})
          .filter(([k,v])=>v).map(([k,v])=>`${k}：${v}`)];
      const p=lines.join('\n');
      (navigator.clipboard?navigator.clipboard.writeText(p):Promise.reject(new Error('no-clip')))
        .then(()=>toast('已复制，可直接粘贴到咨询对话'))
        .catch(()=>{ const ta=document.createElement('textarea'); ta.value=p; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy'); toast('已复制（兼容模式）');}catch(e){ toast('复制失败，请手动选中'); } ta.remove(); });
    };
    dt.appendChild(cb);
    document.getElementById('dBody').appendChild(dt);
    document.getElementById('detailMask').classList.add('show');
  }
  function closeDetail(){ document.getElementById('detailMask').classList.remove('show'); }
  function detailHTML(rec){
    const d=rec.detail||{};
    let h='';
    // 简短信息
    h+='<div class="card"><div class="kv-grid">';
    h+=`<div class="kv"><div class="k">地区</div><div class="v">${esc(rec.region)}</div></div>`;
    h+=`<div class="kv"><div class="k">项目</div><div class="v">${esc(rec.title||'')}</div></div>`;
    h+=`<div class="kv"><div class="k">年份</div><div class="v">${esc(rec.year||'-')}</div></div>`;
    h+=`<div class="kv"><div class="k">县区/单位</div><div class="v">${esc(rec.area||'全部')}</div></div>`;
    // 来源与更新时间（权威性视觉）
    h+=`<div class="kv"><div class="k">可信度</div><div class="v">${sourceBadge(rec)}</div></div>`;
    h+=`<div class="kv"><div class="k">资料更新</div><div class="v">${esc(rec.updatedAt||rec.year||'-')}</div></div>`;
    h+='</div></div>';
    if(rec.summary) h+=`<div class="card"><b>概述</b><div class="pre-wrap">${esc(rec.summary)}</div></div>`;
    h+='<div class="card"><h3>详细考情</h3><div class="kv-grid">';
    // 兼容两套 detail 键名体系：中文键（省级/市级手写数据）与英文键（导入/县区生成）
    const map={dui:'考试科目',duan:'题型分布',shou:'时长题量',shijian:'招考时间规律',yao:'学历/专业/户籍要求',jingz:'竞争难度/进面参考',daiyu:'待遇性价比',zhenti:'真题说明',
      '科目':'考试科目','题型':'题型分布','时长题量':'时长题量','时间规律':'招考时间规律','要求':'学历/专业/户籍要求','竞争难度':'竞争难度/进面参考','待遇':'待遇性价比','真题':'真题说明'};
    const shown={};
    for(const k in map){
      const v = d[k];
      if(!v) continue;
      if(shown[map[k]]) continue;
      shown[map[k]]=true;
      h+=`<div class="kv"><div class="k">${map[k]}</div><div class="v">${esc(v)}</div></div>`;
    }
    h+='</div></div>';
    if(rec.tags&&rec.tags.length) h+='<div>'+rec.tags.map(t=>`<span class="chip hl">${esc(t)}</span>`).join('')+'</div>';
    return h;
  }
  function sourceBadge(rec){
    const nil=(window.SETTINGS&&window.SETTINGS.showSourceTag===false);
    if(nil) return '-';
    const s=String(rec.source||'');
    const s2=String(rec.summary||'');
    if(s.indexOf('真题库')>-1 || s2.indexOf('真题库')>-1) return '<span class="badge" style="background:rgba(26,158,111,.15);color:var(--brand-2)">✔ 真题库</span>';
    if(s.indexOf('公开信息')>-1 || s2.indexOf('公开信息')>-1) return '<span class="badge" style="background:rgba(43,111,179,.12);color:var(--brand)">◍ 公开信息</span>';
    if(s2.indexOf('待核')>-1 || s2.indexOf('待确认')>-1 || s.indexOf('待核')>-1) return '<span class="badge" style="background:rgba(225,82,79,.12);color:var(--accent)">! 待核实</span>';
    return '<span class="badge">常规整理</span>';
  }
  function plainSource(rec){
    if(window.SETTINGS && window.SETTINGS.showSourceTag===false) return '-';
    const s=String(rec.source||''), s2=String(rec.summary||''), yr=String(rec.year||'');
    if(s.indexOf('真题库')>-1 || s2.indexOf('真题库')>-1) return '真题库（真题文件真实存在）';
    if(s.indexOf('公开信息')>-1 || s2.indexOf('公开信息')>-1) return '公开信息整理，以官方公告为准';
    if(s2.indexOf('待核')>-1 || s2.indexOf('待确认')>-1 || yr.indexOf('待')>-1) return '待核实，请以官方公告为准';
    return '常规整理';
  }

  /* ---------- 初始化 ---------- */
  function init(){
    // 样式设置
    document.getElementById('siteTitle').textContent=SETTINGS.siteName||'广东考情通';
    document.getElementById('siteSlogan').textContent=SETTINGS.siteSlogan||'';
    document.documentElement.setAttribute('data-theme', SETTINGS.theme==='dark'?'dark':'light');
    document.getElementById('setTheme').checked = SETTINGS.theme==='dark';
    document.title = SETTINGS.siteName||'广东考情通';
    document.getElementById('ver').textContent=SETTINGS.version||'1.0.0';
    // 恢复会话
    try{ session=JSON.parse(store.get(SESSION_KEY)); }catch(e){ session=null; }

    initSplit(); nav(); stats();
    // 填充下拉
    Search.initFilters();
    Map.init();
    // 若需口令则导入区锁定
    bringLoginMsg();
    // 数据源标签默认
    // settings 回显
    document.getElementById('setName').value=SETTINGS.siteName||'';
    document.getElementById('setSlogan').value=SETTINGS.siteSlogan||'';
    document.getElementById('setFooter').value=SETTINGS.footerNote||'';

    // 导入区控件填充
    Import.initArea();

    // settings listeners
    document.getElementById('setTheme').addEventListener('change', e=>{
      const d=e.target.checked?'dark':'light';
      document.documentElement.setAttribute('data-theme',d);
      SETTINGS.theme=d; toast('主题已切换(存本会与会话)');
    });
    document.getElementById('setName').addEventListener('change', e=>{ SETTINGS.siteName=e.target.value; document.title=e.target.value; document.getElementById('siteTitle').textContent=e.target.value; });
    document.getElementById('jsonImport').addEventListener('change', e=>{ const f=e.target.files[0]; if(!f)return; const rd=new FileReader(); rd.onload=()=>{ try{ const j=JSON.parse(rd.result); if(j.kaoqing&&Array.isArray(j.kaoqing)){ publishRecords(j.kaoqing); toast(`已导入 ${j.kaoqing.length} 条数据到本会话`); Search.run(); stats(); } else { toast('文件格式不符'); } }catch(err){ toast('解析失败: '+err.message); } }; rd.readAsText(f); e.target.value=''; });
  }
  function load(){ } // placeholder, 实际由各模块填充
  function bringLoginMsg(){ document.getElementById('loginMsg').textContent = '默认口令 admin123（可在设置改动）'; }

  /* 会话数据更新路径：导入的记录存 session+合并渲染 */
  function publishRecords(records){
    if(session===null) session={};
    session.records=records; saveSession();
  }
  function sessionRecords(){
    return (session && session.records)?session.records:[];
  }

  return {
    mount: init,
    SESSION_KEY, norm: normRegion, classify: classifyProject, regionProjects, allRecords, sessionRecords, publishRecords,
    toast, download, exportAll, login, changePwd, resetLocal, showDetail, closeDetail, detailHTML,
    search:()=>Search.run(),
    resetSearch:()=>Search.reset(),
    ztSearch:()=>Search.ztRun(),
    importOne:()=>Import.one(),
    previewImported:()=>Import.preview(),
    downloadTemplate:()=>Import.downloadTemplate(),
    importBatch:()=>Import.batch(),
    quick:(q)=>quick(q),
    loadZhen,
    menuToggle,
    esc
  };
})();
// 启动
window.addEventListener('DOMContentLoaded', ()=>{ App.mount(); });