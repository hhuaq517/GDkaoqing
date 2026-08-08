/* ============ 广东考情总览 · 地图互动 ============ */
window.Map = (function(){
  let current = 'province';

  function tabs(){
    const box=document.getElementById('mapTabs');
    const list=[['province','省级统考'],['gwy-city','市级公务员'],['shiye','事业单位'],['jiao','教师招聘'],['yiliao','医疗卫生'],['shequ','社区'],['fuzhi','辅警/司法'],['bianwai','编外/雇员']];
    let h='<div style="display:flex;flex-wrap:wrap;gap:6px">';
    list.forEach(([id,name])=> h+=`<button class="${id===current?'active':''}" data-proj="${id}">${name}</button>`);
    h+='</div>'; box.innerHTML=h;
    box.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ current=b.dataset.proj; tabs(); paint(); }));
  }

  function cityData(alias){ return window.App.allRecords().filter(r=>r.region===alias); }

  function projectName(id){ const p=(window.PROJECTS||[]).find(x=>x.id===id); return p?p.name:id; }

  function paint(){
    const mapBox=document.getElementById('mapBox');
    mapBox.innerHTML = window.GD_MAP_SVG;
    const svg=mapBox.querySelector('svg');
    // 当前项目无记录的城市变灰
    svg.querySelectorAll('.gd-city').forEach(n=>{
      const alias=(n.getAttribute('data-region')||'').replace(/地区$/,'');
      const has = current==='province' ? true : cityData(alias).some(r=>r.project===current);
      if(!has) n.classList.add('dim');
    });
    bindEvents(svg);
    projectOverview();
  }

  function overviewText(alias){
    const records=cityData(alias);
    let h=`<b>${window.App.esc(alias)}</b> · <span style="color:var(--brand)">${projectName(current)}</span>`;
    if(current==='province'){
      const all=records;
      if(!all.length){ return h+'<div style="margin-top:6px">暂无整理记录（可到考情导入补充）</div>'; }
      const uniq=Array.from(new Set(all.map(r=>r.title)));
      return h+uniq.map(t=>`<div style="margin-top:6px"><b>${window.App.esc(t)}</b></div>`).join('')+`<div style="margin-top:6px;color:var(--muted)">共 ${all.length} 条考情，下滑/点击查看详情</div>`;
    }
    const rs=records.filter(r=>r.project===current|| (current==='province'));
    if(!rs.length){ return h+'<div style="margin-top:6px">该项目暂无独立整理记录</div>'; }
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
    svg.querySelectorAll('.gd-city').forEach(n=>{
      const alias=(n.getAttribute('data-region')||'').replace(/地区$/,'');
      n.addEventListener('mouseenter', ()=>{
        hc.innerHTML=overviewText(alias);
        svg.querySelectorAll('.gd-city').forEach(o=>o.classList.add('dim'));
        n.classList.remove('dim');
        if(n.querySelector('circle')){ n.querySelector('circle').style.transform='scale(1.3)'; n.querySelector('circle').style.transformOrigin='center'; }
      });
      n.addEventListener('mouseleave', ()=>{
        hc.innerHTML='<b>👆 把鼠标移到地图城市上</b><br><br>这里会显示对应地市的考情速览。';
        svg.querySelectorAll('.gd-city').forEach(o=>{ if(noData(o)) o.classList.add('dim'); else o.classList.remove('dim'); });
      });
      n.addEventListener('click', ()=>{
        document.querySelector('.nav-item[data-view="search"]').click();
        document.getElementById('fRegion').value=alias;
        document.getElementById('fProject').value=(current==='province'?'':current);
        window.App.search();
      });
    });
    function noData(o){
      const a=(o.getAttribute('data-region')||'').replace(/地区$/,'');
      return cityData(a).length===0 && current!=='province';
    }
  }

  function init(){ tabs(); paint(); }
  return { init, paint };
})();