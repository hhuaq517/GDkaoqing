/* ============ 设置页补充交互（主题/名称/页脚等，主逻辑在 app.js） ============ */
window.Settings = (function(){
  function init(){
    const $=id=>document.getElementById(id);
    const A=window.App;
    // 名称/标语/页脚回显
    $('setName').value = SETTINGS.siteName||'';
    $('setSlogan').value = SETTINGS.siteSlogan||'';
    $('setFooter').value = SETTINGS.footerNote||'';
    // 页脚写入
    if(SETTINGS.footerNote){ /* 展示在关于卡片 */ }
  }
  return { init };
})();
document.addEventListener('DOMContentLoaded', ()=>{ window.Settings.init(); });