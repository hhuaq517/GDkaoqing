/* 数据更新工具：把网页“导出数据”生成的 kaoqing_导出.json 合并回 data/kaoqing.js
   用法： node tools/merge_export.js [导出的json路径]
   会重新生成 data/kaoqing.js = 导出数据中的 records 集合（该导出集为最权威全量）。
   之后把 data/kaoqing.js 提交到 GitHub 即可让所有访客看到新数据。
*/
const fs=require('fs'), path=require('path');
const base=path.join(__dirname,'..');
const vm=require('vm');

const defJson=path.join(process.cwd(),'kaoqing_导出.json');
const arg=process.argv[2]||defJson;
if(!fs.existsSync(arg)){ console.error('未找到导出文件：'+arg); console.error('请先下载 kaoqing_导出.json，或指定路径: node tools/merge_export.js <路径>'); process.exit(1); }

const exp=JSON.parse(fs.readFileSync(arg,'utf8'));
const records=Array.isArray(exp.kaoqing)? exp.kaoqing : Array.isArray(exp.records)? exp.records : null;
if(!records){ console.error('导出文件结构不正确（缺少 kaoqing 数组）'); process.exit(1); }
if(!Array.isArray(records) || records.length===0){ console.error('无有效考情记录'); process.exit(1); }

const meta={ note:'由网页导出数据生成', updatedAt:new Date().toISOString().slice(0,10), exportedAt:exp.exportedAt||'-', site:(exp.app||'广东考情通') };
const out=`/* 广东考情通 · 考情数据库（由 tools/merge_export.js 根据导出数据自动生成，可直接手动编辑） */
window.KAOQING = ${JSON.stringify({meta,records},null,2)};
`;
const outFile=path.join(base,'data','kaoqing.js');
fs.writeFileSync(outFile,out,'utf8');
console.log('✔ 已重新生成 data/kaoqing.js，共 '+records.length+' 条记录');
console.log('  下一步：提交到 GitHub 仓库即可让所有访客看到新数据。');