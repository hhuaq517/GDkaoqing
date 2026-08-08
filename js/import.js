/* ============ 考情导入 ============ */
window.Import = (function(){
  const A=window.App;
  let __batch=[];

  function initArea(){ /* selects 由 Search.fillImportControls 填充 */ }

  function collectForm(){
    const g=id=>document.getElementById(id).value.trim();
    const rec={
      region:A.norm(g('impRegion')),
      project:g('impProject'),
      area:g('impArea'),
      title:g('impTitle')||( (window.PROJECTS.find(p=>p.id===g('impProject'))||{}).name || g('impProject') ),
      year:g('impYear'),
      summary:g('impSummary'),
      detail:{ dui:g('impDui'), duan:g('impDuan'), shou:g('impShou'), shijian:g('impShijian'), yao:g('impYao'), jingz:g('impJingz'), daiyu:g('impDaiyu'), zhenti:g('impZhenti') },
      tags:g('impTags').split(/[,，、]/).map(s=>s.trim()).filter(Boolean),
      updatedAt:new Date().toISOString().slice(0,10)
    };
    return rec;
  }

  function one(){
    const rec=collectForm();
    if(!rec.title){ A.toast('请填写标题'); return; }
    const s=A.sessionRecords(); s.push(rec); A.publishRecords(s);
    A.toast('✔ 已保存 1 条考情（本会话数据，导出一并带走）');
    document.querySelector('.nav-item[data-view="search"]').click();
    A.search();
  }

  function preview(){
    const rec=collectForm();
    if(!rec.title){ A.toast('请先填写标题'); return; }
    let h=`<table class="tbl"><tr><th>字段</th><th>值</th></tr>`;
    h+=`<tr><td>地区</td><td>${A.esc(rec.region)}</td></tr><tr><td>项目</td><td>${A.esc(rec.project)}</td></tr>`;
    h+=`<tr><td>标题</td><td>${A.esc(rec.title)}</td></tr><tr><td>年份</td><td>${A.esc(rec.year)}</td></tr>`;
    h+=`<tr><td>概述</td><td>${A.esc(rec.summary)}</td></tr>`;
    h+=`<tr><td>科目</td><td>${A.esc(rec.detail.dui)}</td></tr><tr><td>时间规律</td><td>${A.esc(rec.detail.shijian)}</td></tr></table>`;
    const d=document.createElement('div'); d.className='modal-mask show';
    d.innerHTML=`<div class="modal"><h3>待入库预览</h3>${h}<div style="margin-top:12px"><button class="btn primary" onclick="document.querySelectorAll('.modal-mask').forEach(x=>x.classList.remove('show'))">知道了</button></div></div>`;
    d.addEventListener('click',e=>{ if(e.target===d) d.classList.remove('show'); });
    document.body.appendChild(d);
  }

  function downloadTemplate(){
    const csv=`地区,项目,县区/单位,标题,年份,一句话概述,考试科目,题型分布,时长题量,招考时间规律,学历专业户籍要求,竞争难度,待遇性价比,真题说明,标签,备注\n广州,事业单位,,广州市事业单位招聘,2019-2026,广州事业单位以统考+区市直单招并行,统考公基+职测；单招综合能力,客观题为主,90分钟,统考3-4月,本科为主,竞争激烈,编制待遇靠前,真题库含市直各区真题,事业单位,广州,\n韶关,教师招聘,乳源,韶关乳源教师招聘,2021-2023,教综+学科分科命题,教育综合知识+学科知识,客观题为主,120分钟,春夏季多批,本科以上需教资,竞争中等,编制待遇适中,真题库含乳源各学科真题,教综;学科,样例`;
    A.download('考情导入模板.csv','\ufeff'+csv,'text/csv');
    A.toast('已下载模板，用 Excel/WPS 打开即可编辑');
  }

  /* CSV 解析（支持引号与逗号） */
  function parseCSV(text){
    const rows=[]; let row=[],cell='',inq=false;
    for(let i=0;i<text.length;i++){ const c=text[i];
      if(inq){ if(c==='"'){ if(text[i+1]==='"'){ cell+='"'; i++; } else inq=false; } else cell+=c; }
      else if(c==='"') inq=true;
      else if(c===','){ row.push(cell); cell=''; }
      else if(c==='\n'||c==='\r'){ if(c==='\r'&&text[i+1]==='\n') i++; row.push(cell); cell=''; if(row.join('').replace(/[,，]/g,'')!=='') rows.push(row); row=[]; }
      else cell+=c;
    }
    if(cell!==''||row.length){ row.push(cell); if(row.join('').replace(/[,，]/g,'')!=='') rows.push(row); }
    return rows;
  }

  function file2records(text){
    const rows=parseCSV(text); if(!rows.length) return {err:'空文件'};
    const head=rows[0].map(s=>s.trim());
    const idx=k=>head.indexOf(k);
    const cols=['地区','项目','县区/单位','标题','年份','一句话概述','考试科目','题型分布','时长题量','招考时间规律','学历专业户籍要求','竞争难度','待遇性价比','真题说明','标签','备注'];
    // 校验表头
    const miss=cols.filter(c=>idx(c)<0);
    if(miss.length) return {err:'缺少列：'+miss.join('、')};
    const recs=[];
    for(let i=1;i<rows.length;i++){
      const r=rows[i], v=k=>{ const j=idx(k); return (r[j]==null?'':r[j]).trim(); };
      const region=A.norm(v('地区'));
      const rawProj=v('项目');
      let proj=rawProj;
      // 尝试标准化
      const found=(window.PROJECT_RULES||[]).find(rule=>rule.kws.some(k=>String(rawProj).includes(k)));
      if(found) proj=found.id;
      else if((window.PROJECTS||[]).find(p=>p.id===rawProj)) proj=rawProj;
      recs.push({
        region, project:proj, area:v('县区/单位'), title:v('标题')||proj,
        year:v('年份'), summary:v('一句话概述'),
        detail:{ dui:v('考试科目'), duan:v('题型分布'), shou:v('时长题量'), shijian:v('招考时间规律'), yao:v('学历专业户籍要求'), jingz:v('竞争难度'), daiyu:v('待遇性价比'), zhenti:v('真题说明') },
        tags:v('标签').split(/[,，;；]/).map(s=>s.trim()).filter(Boolean),
        updatedAt:new Date().toISOString().slice(0,10)
      });
    }
    return {recs};
  }

  function showPreview(recs){
    __batch=recs;
    const box=document.getElementById('batchPreview');
    if(!recs.length){ box.innerHTML=''; return; }
    let h=`<div style="margin-bottom:6px">已解析 <b>${recs.length}</b> 行（点击“解析并导入”正式入库）：</div><table class="tbl"><tr><th>#</th><th>地区</th><th>项目</th><th>县区</th><th>标题</th><th>年份</th></tr>`;
    recs.slice(0,12).forEach((r,i)=>{ h+=`<tr><td>${i+1}</td><td>${A.esc(r.region)}</td><td>${A.esc(r.project)}</td><td>${A.esc(r.area)}</td><td>${A.esc(r.title)}</td><td>${A.esc(r.year)}</td></tr>`; });
    if(recs.length>12) h+=`<tr><td colspan="6">… 共 ${recs.length} 条</td></tr>`;
    h+='</table>';
    box.innerHTML=h;
  }

  function bindDrop(){
    const dz=document.getElementById('dropZone'), fi=document.getElementById('fileInput');
    dz.addEventListener('click',()=>fi.click());
    dz.addEventListener('dragover',e=>{ e.preventDefault(); dz.classList.add('over'); });
    dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
    dz.addEventListener('drop',e=>{ e.preventDefault(); dz.classList.remove('over'); const f=e.dataTransfer.files[0]; if(f) read(f); });
    fi.addEventListener('change',()=>{ if(fi.files[0]) read(fi.files[0]); fi.value=''; });
    function read(f){
      const rd=new FileReader();
      rd.onload=()=>{
        let text=rd.result;
        // 去除 BOM
        if(text.charCodeAt(0)===0xFEFF) text=text.slice(1);
        const res=file2records(text);
        if(res.err){ A.toast('解析失败：'+res.err); return; }
        showPreview(res.recs);
        A.toast(`解析成功 ${res.recs.length} 条，点“解析并导入”入库`);
      };
      rd.readAsText(f,'utf-8');
    }
  }

  function batch(){
    if(!__batch.length){ A.toast('请先选择表格文件并成功解析'); return; }
    const s=A.sessionRecords(); __batch.forEach(r=>s.push(r)); A.publishRecords(s);
    A.toast(`✔ 已导入 ${__batch.length} 条考情（本会话数据，导出可带走）`);
    __batch=[]; document.getElementById('batchPreview').innerHTML='';
    A.search();
  }

  return { initArea, one, preview, downloadTemplate, batch, bindDrop };
})();
document.addEventListener('DOMContentLoaded', ()=>{ window.Import.bindDrop(); });