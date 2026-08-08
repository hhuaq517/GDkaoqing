/* 项目分类标准化：把真题文件夹里五花八门的项目名归一到标准项目 */
window.PROJECT_RULES = [
  { id:"province",  name:"省级统考(省考/选调/三支/事业统考)", type:"公务员·省级", color:"#c0392b", kws:["省考","国考","选调","三支一扶","统考","广东选调"] },
  { id:"gwy-city",  name:"市级公务员(深圳市考等)", type:"公务员·市级", color:"#e67e22", kws:["深圳市考","市考","紧缺","专项招录"] },
  { id:"shiye",     name:"事业单位",                     type:"事业编",     color:"#2b6fb3", kws:["事业单位","事业编","事业","事编","统","直聘","招录","人员","编制","事编"] },
  { id:"jiao",      name:"教师招聘",                     type:"事业编",     color:"#1a9e6f", kws:["教师招聘","教师编","教招","教师","编制教师"] },
  { id:"yiliao",    name:"医疗卫生招聘",                 type:"事业编",     color:"#0a9e9e", kws:["医疗","卫生","医护","医招","医院","医师","护理"] },
  { id:"shequ",     name:"社区工作者",                   type:"社工",       color:"#16a085", kws:["社区工作者","社区","社工","街道"] },
  { id:"fuzhi",     name:"辅警/协警",                    type:"编外",       color:"#7f8c8d", kws:["辅警","协警","交警"] },
  { id:"siji",      name:"司法/书记员",                 type:"编外",       color:"#5d6d7e", kws:["司法","书记员","法院","书记","辅助人员"] },
  { id:"bianwai",   name:"编外/政府雇员",               type:"编外",       color:"#95a5a6", kws:["编外","雇员","编外雇员","编外人员"] },
  { id:"fudao",     name:"高校辅导员",                  type:"编外",       color:"#d35400", kws:["高校辅导员","辅导员"] },
];

window.PROJECTS = [
  { id:"province", name:"省级统考", color:"#c0392b", group:"公务员·省级", tip:"省考/国考/选调/三支一扶/事业统考" },
  { id:"gwy-city", name:"市级公务员", color:"#e67e22", group:"公务员·市级", tip:"如深圳市考、专项招录" },
  { id:"shiye",    name:"事业单位", color:"#2b6fb3", group:"事业编", tip:"" },
  { id:"jiao",     name:"教师招聘", color:"#1a9e6f", group:"事业编", tip:"" },
  { id:"yiliao",   name:"医疗卫生招聘", color:"#0a9e9e", group:"事业编", tip:"" },
  { id:"shequ",    name:"社区工作者", color:"#16a085", group:"基层/社工", tip:"" },
  { id:"fuzhi",    name:"辅警/司法辅助", color:"#7f8c8d", group:"编外", tip:"" },
  { id:"bianwai",  name:"编外/政府雇员", color:"#95a5a6", group:"编外", tip:"" },
];

window.REGIONS = [
  { name:"广东", alias:"全省" },
  { name:"广州", alias:"广州" }, { name:"深圳", alias:"深圳" }, { name:"佛山", alias:"佛山" },
  { name:"东莞", alias:"东莞" }, { name:"中山", alias:"中山" }, { name:"珠海", alias:"珠海" },
  { name:"惠州", alias:"惠州" }, { name:"江门", alias:"江门" }, { name:"肇庆", alias:"肇庆" },
  { name:"汕头", alias:"汕头" }, { name:"汕尾", alias:"汕尾" }, { name:"潮州", alias:"潮州" },
  { name:"揭阳", alias:"揭阳" }, { name:"梅州", alias:"梅州" }, { name:"河源", alias:"河源" },
  { name:"韶关", alias:"韶关" }, { name:"清远", alias:"清远" }, { name:"湛江", alias:"湛江" },
  { name:"茂名", alias:"茂名" }, { name:"阳江", alias:"阳江" }, { name:"云浮", alias:"云浮" },
];