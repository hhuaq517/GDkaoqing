/* ============ 广东考情总览 · 真实地图互动（省市两级下钻） ============ */
window.Map = (function(){
  let current = 'province';
  let level = 'province';
  let activeCity = null;

  function tabs(){
    const box=document.getElementById('mapTabs');
    const list=[['province','省级统考'],['gwy-city','市级公务员'],['shiye','事业单位'],['jiao','教师招聘'],['yiliao','医疗卫生'],['shequ','社区'],['fuzhi','辅警/司法'],['bianwai','编外/雇员']];
    let h='<div style="display:flex;flex-wrap:wrap;gap:6px">';
    list.forEach(([id,name])=> h+=`<button class="${id===current?'active':''}" data-proj="${id}">${name}</button>`);
    h+='</div>'; box.innerHTML=h;
    box.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ current=b.dataset.proj; tabs(); paint(); }));
  }

  function cityData(alias){ return window.App.allRecords().filter(r=>(r.region||'').replace(/地区$/,'')===alias); }
  function projectName(id){ const p=(window.PROJECTS||[]).find(x=>x.id===id); return p?p.name:id; }

  function paint(){
    const mapBox=document.getElementById('mapBox');
    let svgText;
    if(level==='province'){ svgText = window.GD_PROVINCE_SVG || window.GD_MAP_SVG; }
    else { svgText = (window.GD_DISTRICT_SVG && window.GD_DISTRICT_SVG[activeCity]) || window.GD_PROVINCE_SVG; }
    mapBox.innerHTML = svgText;
    const svg=mapBox.querySelector('svg');
    bindEvents(svg);
    projectOverview();
    renderBreadcrumb();
  }

  function renderBreadcrumb(){
    const bc=document.getElementById('mapCrumb');
    if(!bc) return;
    if(level==='province'){
      bc.innerHTML='<button class="btn ghost sm active">广东全省</button><span class="text-muted"> 点击任意地市可下钻到县区</span>';
    } else {
      bc.innerHTML=`<button class="btn ghost sm" onclick="Map.backProv()">← 返回全省</button><span class="badge">${window.App.esc(activeCity||'')}</span><span class="text-muted">悬停县区查看该县考情</span>`;
    }
  }

  function overviewDistrict(alias, dist){
    // 该县区在本项目下的记录
    const countyRecs = window.App.allRecords().filter(r=>(r.area||'').indexOf(dist)!==-1);
    let h=`<b>${window.App.esc(alias)}·${window.App.esc(dist)}</b> · <span style="color:var(--brand)">${projectName(current)}</span>`;
    const rs=countyRecs.filter(r=> current==='province' || r.project===current);
    if(rs.length){
      rs.slice(0,3).forEach(r=>{ h+=`<div style="margin-top:8px;border-top:1px dashed var(--line);padding-top:6px"><b>${window.App.esc(r.title||'')}</b> <span class="badge">${window.App.esc(r.year||'')}</span><div style="margin-top:3px">${window.App.esc(r.summary||'')}</div></div>`; });
      return h;
    }
    // 兜底：该县无记录时，展示该市在本项目下的汇总记录
    const cityRs = window.App.allRecords().filter(r=>r.region.replace(/地区$/,'')===alias && (current==='province'||r.project===current));
    if(cityRs.length){
      h+=`<div style="margin-top:6px;color:var(--muted)">该县/区暂无本项目独立记录，以下为该市汇总考情：</div>`;
      cityRs.slice(0,3).forEach(r=>{ h+=`<div style="margin-top:8px;border-top:1px dashed var(--line);padding-top:6px"><b>${window.App.esc(r.title||'')}</b> <span class="badge">${window.App.esc(r.year||'')}</span><div style="margin-top:3px">${window.App.esc(r.summary||'')}</div></div>`; });
      return h;
    }
    return h+`<div style="margin-top:6px;color:var(--muted)">该项目暂无整理记录，可到【考情导入】补充。</div>`;
  }

  function overviewText(alias){
    const records=cityData(alias);
    let h=`<b>${window.App.esc(alias)}</b> · <span style="color:var(--brand)">${projectName(current)}</span>`;
    if(current==='province'){
      // 省级统考：省考/选调/统考全省适用，展示省招信息 + 该市对此类项目的真题覆盖
      const provRecs = window.App.allRecords().filter(r=> /^(广东)/.test(r.region||'') && r.project==='province');
      provRecs.slice(0,3).forEach(r=>{
        h+=`<div style="margin-top:6px"><b>${window.App.esc(r.title)}</b><div style="margin-top:2px;color:var(--text);font-size:12.5px">${window.App.esc((r.summary||'').slice(0,60))}…</div></div>`;
      });
      // 市级真题覆盖（county 与市级里 project 属于省级可叠加的）
      const ztN = new Set();
      window.App.allRecords().forEach(r=>{
        if((r.region||'').replace(/地区$/,'')===alias && (r.project==='province'||r.project==='shiye')) ztN.add(r.title||'');
      });
      h+=`<div style="margin-top:8px;color:var(--muted)">${alias}本地真题/事业编资料 ${ztN.size} 项；点下方选项卡切换项目，悬停查看市级拆分</div>`;
      return h;
    }
    const rs=records.filter(r=>r.project===current);
    if(!rs.length){ return h+'<div style="margin-top:6px">该项目暂无独立整理记录，点击县区可查看县级真题覆盖</div>'; }
    rs.slice(0,4).forEach(r=>{ h+=`<div style="margin-top:8px;border-top:1px dashed var(--line);padding-top:6px"><b>${window.App.esc(r.title||'')}</b> <span class="badge">${window.App.esc(r.year||'')}</span><div style="margin-top:3px">${window.App.esc(r.summary||'')}</div></div>`; });
    return h;
  }

  function projectOverview(){
    document.getElementById('ovProjTitle').textContent='当前项目：'+projectName(current);
    const body=document.getElementById('ovProjBody');
    let recs;
    if(current==='province'){ recs=window.App.allRecords().filter(r=> r.region==='广东'); }
    else { recs=window.App.allRecords().filter(r=> r.project===current); }
    if(!recs.length){ body.innerHTML='暂无整理记录，可在【考情导入】中补充。'; return; }
    if(current==='province'){ body.innerHTML=recs.map(r=>`◆ <b>${window.App.esc(r.title)}</b>：${window.App.esc(r.summary)}<br><br>`).join(''); return; }
    const groups={}; recs.forEach(r=>{ const b=(r.region||'其他'); (groups[b]=groups[b]||[]).push(r); });
    body.innerHTML=Object.keys(groups).sort().map(g=>`<b>📍 ${window.App.esc(g)}</b> ${groups[g].map(it=>`<span class="chip">${window.App.esc(it.title||it.project)}${it.year?'（'+window.App.esc(it.year)+'）':''}</span>`).join('')}`).join('<br><br>');
  }

  function bindEvents(svg){
    const hc=document.getElementById('hoverCard');
    const isTouch = window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches;
    let tapState=null; // {node, at}
    if(level==='province'){
      svg.querySelectorAll('.gd-city').forEach(n=>{
        const alias=(n.getAttribute('data-region')||'').replace(/地区$/,'');
        n.addEventListener('mouseenter', ()=>{
          hc.innerHTML=overviewText(alias);
          dimExcept(n);
        });
        n.addEventListener('mouseleave', ()=>{ resetHover(); });
        const go=()=>{
          if(window.GD_DISTRICT_SVG && window.GD_DISTRICT_SVG[alias]) drill(alias);
          else jumpToSearch(alias);
        };
        n.addEventListener('click', go);
        tapTo(n, ()=>overviewText(alias), go);
      });
    } else if(level==='city' && activeCity){
      svg.querySelectorAll('.gd-dist').forEach(n=>{
        const city=(n.getAttribute('data-city')||'').replace(/地区$/,'');
        const dist=n.getAttribute('data-name');
        n.addEventListener('mouseenter', ()=>{
          hc.innerHTML=overviewDistrict(city, dist);
          dimExcept(n);
        });
        n.addEventListener('mouseleave', ()=>{ resetHover(); });
        const go=()=>jumpToSearch(city, dist);
        n.addEventListener('click', go);
        tapTo(n, ()=>overviewDistrict(city, dist), go);
      });
    }

    function dimExcept(n){ svg.querySelectorAll('.gd-city,.gd-dist').forEach(o=>o.classList.add('dim')); n.classList.remove('dim'); }
    function resetHover(){
      hc.innerHTML = level==='province' ? '<b>👆 把鼠标移到地图城市上</b><br><br>这里会显示对应地市的考情速览。' : '<b>👆 把鼠标移到县区上</b><br><br>这里会显示该县/区在本项目下的考情。';
      svg.querySelectorAll('.gd-city,.gd-dist').forEach(o=>o.classList.remove('dim'));
      tapState=null;
    }
    function tapTo(n, show, go){
      if(!isTouch) return;
      n.addEventListener('click', (e)=>{
        const now=Date.now();
        if(tapState && tapState.node===n && now-tapState.at < 1400){
          e.preventDefault(); tapState=null; go();
        } else {
          tapState={node:n, at:now};
          hc.innerHTML=show();
          dimExcept(n);
          setTimeout(()=>{ if(tapState && tapState.node===n) tapState=null; }, 1600);
        }
      });
    }
  }

  function drill(alias){
    level='city'; activeCity=alias;
    paint();
  }

  /* 地图 → 搜索跳转：地区用裸名（option 值即裸名），归一化匹配 */
  function jumpToSearch(city, dist){
    window.location.hash='search';
    const fRegion=document.getElementById('fRegion');
    fRegion.value = window.App.norm(city);
    const fArea=document.getElementById('fArea'); fArea.value = dist||'';
    document.getElementById('fProject').value = '';
    window.App.search();
  }

  function backProv(){ level='province'; activeCity=null; paint(); }

  function init(){ tabs(); paint(); }
  return { init, paint, backProv };
})();