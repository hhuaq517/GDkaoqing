/* ============ 地区考情查找 ============ */
window.Search = (function(){
  function initFilters(){
    const fr=document.getElementById('fRegion');
    fr.innerHTML='<option value="">全部地区</option>'+(window.REGIONS||[]).map(r=>`<option value="${r.name}">${r.name}</option>`).join('');
    const fp=document.getElementById('fProject');
    fp.innerHTML='<option value="">全部项目</option>'+(window.PROJECTS||[]).map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
    const fy=document.getElementById('fYear');
    const years=new Set(); window.App.allRecords().forEach(r=>{ (String(r.year||'').match(/20[0-2][0-9]/g)||[]).forEach(y=>years.add(y)); });
    fy.innerHTML='<option value="">全部年份</option>'+[...years].sort().map(y=>`<option>${y}</option>`).join('');
    fillImportControls();
    // 真题索引懒加载：数据未就绪先占位，进入真题面板时补全
    if(window.ZHENTI) ztInitRegions();
    else ztInitPlaceholder();
  }

  function ztInitPlaceholder(){
    const r=document.getElementById('ztRegion');
    r.innerHTML='<option value="">（正在加载真题索引…）</option>';
    const p=document.getElementById('ztProject');
    p.innerHTML='<option value="">（加载中…）</option>';
  }

  function showZhentiQuick(){
    const np=document.getElementById('zhentiPanel');
    np.style.display='block';
    document.getElementById('ztTree').innerHTML='<div class="card" style="color:var(--muted)">索引已就绪，选择地区/项目后点“查看”。</div>';
    ztInitRegions();
    ztRun();
  }

  function fillImportControls(){
    document.getElementById('impRegion').innerHTML=(window.REGIONS||[]).map(x=>`<option value="${x.name}">${x.name}</option>`).join('');
    document.getElementById('impProject').innerHTML=(window.PROJECTS||[]).map(x=>`<option value="${x.id}">${x.name}</option>`).join('');
  }

  function hasYear(rec,y){
    const s=String(rec.year||'');
    // 区间：2018~2025 / 2021-2024 / 2019—2026
    const range=s.match(/(20[0-2][0-9])\s*[~\-–—]\s*(20[0-2][0-9])/);
    if(range){ const a=+range[1], b=+range[2]; return +y >= Math.min(a,b) && +y <= Math.max(a,b); }
    const m=s.match(/\d{4}/g)||[];
    if(m.length===0) return false;
    return m.some(v=>v===y);
  }

  function matches(rec,o){
    if(o.region){ const ar=String(rec.region||''); if(rec.region!==o.region && !ar.includes(o.region)) return false; }
    if(o.project){ if(!(rec.project===o.project)) return false; }
    if(o.year && !hasYear(rec,o.year)) return false;
    if(o.area && !String(rec.area||'').includes(o.area)) return false;
    if(o.kw){
      const hay=[rec.title,rec.summary,rec.region,rec.project,rec.area,(rec.tags||[]).join(','),JSON.stringify(rec.detail||{})].join(' ').toLowerCase();
      if(!hay.includes(o.kw.toLowerCase())) return false;
    }
    return true;
  }

  function run(){
    const o={
      region:document.getElementById('fRegion').value,
      project:document.getElementById('fProject').value,
      year:document.getElementById('fYear').value,
      area:document.getElementById('fArea').value.trim(),
      kw:document.getElementById('fKw').value.trim()
    };
    render(window.App.allRecords().filter(r=>matches(r,o)));
  }
  function reset(){ ['fRegion','fProject','fYear','fArea','fKw'].forEach(id=>document.getElementById(id).value=''); run(); }

  function render(list){
    document.getElementById('searchInfo').textContent=`${list.length} 条结果`;
    const box=document.getElementById('searchResults');
    box.innerHTML='';
    if(!list.length){ box.innerHTML='<div class="card" style="text-align:center;color:var(--muted)">未找到匹配考情，试试放宽筛选，或到【考情导入】补充。</div>'; return; }
    const grid=document.createElement('div'); grid.className='grid cols2';
    list.forEach(rec=>{
      const pj=(window.PROJECTS||[]).find(p=>p.id===rec.project);
      const card=document.createElement('div'); card.className='kq-card'; card.style.borderLeftColor=pj?pj.color:'var(--brand)';
      const dur=rec.detail&&(rec.detail.shijian||rec.detail['时间规律'])?(rec.detail.shijian||rec.detail['时间规律']):'时间待补';
      const dui=rec.detail&&(rec.detail.dui||rec.detail['科目'])?(rec.detail.dui||rec.detail['科目']):'科目待补';
      card.innerHTML=`
        <div class="top">
          <span class="city">${window.App.esc(rec.region||'')}</span>
          <span class="proj" style="background:${pj?pj.color:'var(--brand)'}">${window.App.esc(pj?pj.name:rec.project)}</span>
          <span class="years">${rec.year?window.App.esc(rec.year):''}${rec.area?' · '+window.App.esc(rec.area):''}</span>
          ${(window.SETTINGS&&window.SETTINGS.showSourceTag===false)?'':'<span class="src-tag">'+((rec.source||String(rec.summary||'')).indexOf('真题库')>-1?'真题库':'整理')+'</span>'}
        </div>
        <div class="sum">${window.App.esc(rec.summary||'')}</div>
        <div class="meta"><span>📅 ${window.App.esc(dur)}</span><span>✍️ ${window.App.esc(dui)}</span></div>
        <div class="open">查看详细考情 ▸</div>`;
      card.querySelector('.open').addEventListener('click', ()=>window.App.showDetail(rec));
      grid.appendChild(card);
    });
    box.appendChild(grid);
  }

  /* ---------- 真题索引 ---------- */
  function ztInitRegions(){
    const r=document.getElementById('ztRegion');
    const regs=(window.ZHENTI.regions||[]).map(x=>x.region);
    r.innerHTML='<option value="">全部地区</option>'+regs.map(x=>`<option value="${x}">${x}</option>`).join('');
    // 项目多选静态
    const p=document.getElementById('ztProject');
    p.innerHTML='<option value="">全部项目</option>'+regs.map(()=>'').join('')+Array.from(new Set((window.ZHENTI.regions||[]).flatMap(r=>(r.projects||[]).map(x=>x.project)))).map(x=>`<option value="${x}">${x}</option>`).join('');
  }
  function ztRun(){
    const region=document.getElementById('ztRegion').value;
    const project=document.getElementById('ztProject').value;
    const tree=document.getElementById('ztTree'); tree.innerHTML='';
    const regions=(window.ZHENTI.regions||[]).filter(r=>!region||r.region===region);
    if(!regions.length){ tree.innerHTML='<div class="card" style="color:var(--muted)">无匹配真题索引</div>'; return; }
    regions.forEach(r=>{
      (r.projects||[]).filter(p=>!project||p.project===project).forEach(p=>{
        const node=document.createElement('div'); node.className='node';
        node.innerHTML=`<div class="node-h">📁 ${window.App.esc(r.region)} · <b>${window.App.esc(p.project)}</b> <span class="badge">${(p.sources||[]).length} 个真题文件夹</span></div>`;
        const b=document.createElement('div'); b.className='node-b';
        (p.sources||[]).forEach(s=>{
          b.innerHTML+=`<div class="file">▪ <b>${window.App.esc(s.name)}</b>（${s.fileCount||0} 个文件${s.years&&s.years.length?'，年份 '+s.years.join('/'):''}${s.subjects&&s.subjects.length?'，涉及 '+s.subjects.join('、'):''}）</div>`;
        });
        node.appendChild(b);
        node.querySelector('.node-h').addEventListener('click',()=>node.classList.toggle('open'));
        tree.appendChild(node);
      });
    });
  }
  return { initFilters, run, reset, ztInitRegions, ztRun, showZhentiQuick };
})();