/* 專案索引資料產生器：由 GitHub 自動排程執行，讀取各程式庫程式碼，判斷每個系統有哪些功能，寫入 data.json */
import fs from 'node:fs';
const H=process.env.GITHUB_TOKEN?{Authorization:'Bearer '+process.env.GITHUB_TOKEN}:{};
const OWNER='BearBabyBaby-ai';
/* 不列入的程式庫 */
const SKIP=['bear-game','adsb-list','bearbabybaby-ai.github.io','repository-name'];
/* 已知系統的中文名稱；新程式庫會自動用它網頁的標題 */
const KNOWN=['bearbear','bearbao','bearbao-mini','Lantern-Festival','penghu-bear-journey','penghu-food'];
const NAME={'bearbear':'熊熊綜合系統','bearbao':'熊寶系統','bearbao-mini':'熊寶小資訊','lantern-festival':'2027澎湖元宵','penghu-bear-journey':'熊熊澎湖之旅','penghu-food':'澎湖資訊推薦'};
/* 功能分類與判斷用的關鍵字（程式碼裡出現兩次以上才算有這項功能） */
const CATS=[
 ['在地資料','#6fa8ff',[['美食',['美食']],['景點',['景點']],['廟宇',['廟宇']],['其他店家',['其他店家']],['行程業者',['行程業者']],['港口與遊客中心',['遊客中心']]]],
 ['潮汐天氣','#4fd6d0',[['奎壁山分海',['奎壁山']],['30天潮汐預報',['30天潮汐','潮汐預報']],['風浪天氣',['風浪']],['池西岩瀑',['池西岩瀑']]]],
 ['交通航班','#f2d65a',[['航班動態',['航班']],['查機位',['查機位']],['候補資訊',['候補']],['船舶動態',['船舶']]]],
 ['地圖導航','#ff9a4d',[['互動地圖',['地圖']],['立體地圖',['3D']],['導航',['導航']],['路線',['路線']],['測速與科技執法',['測速']]]],
 ['活動廟宇','#ff6f7d',[['月曆活動',['月曆']],['元宵資訊',['元宵']],['花火節',['花火']],['集章',['集章']],['主祀判斷',['主祀']]]],
 ['個人管理','#b68cff',[['重要資訊提醒',['重要資訊提醒']],['財務管理',['財務']],['機票搶票提醒',['搶票']],['特殊日期生日',['特殊日期']],['工作模式查詢',['工作模式']],['後台編修',['後台']]]]
];
const BAD=/(^|\/)(lib|libs|node_modules|tests?|assets|icons|scripts|tools|sources|docs|google-sites|build|apk|\.github|native\/www|www\/lib|leaflet|markercluster)\//i;
const CODE=/\.(html|js|cjs|mjs)$/i;
async function j(u){const r=await fetch(u,{headers:H});if(!r.ok)throw new Error(r.status+' '+u);return r.json()}
async function t(u){try{const r=await fetch(u);return r.ok?await r.text():''}catch(e){return ''}}
const raw=(repo,br,p)=>`https://raw.githubusercontent.com/${OWNER}/${repo}/${br}/${p.split('/').map(encodeURIComponent).join('/')}`;
const count=(txt,kws)=>kws.reduce((s,k)=>s+txt.split(k).length-1,0);
const repos=(await j(`https://api.github.com/users/${OWNER}/repos?per_page=100`)).filter(r=>!r.fork&&r.size>0&&!SKIP.includes(r.name.toLowerCase()));
const systems=[];
for(const r of repos){
 const br=r.default_branch;
 const tree=(await j(`https://api.github.com/repos/${OWNER}/${r.name}/git/trees/${br}?recursive=1`)).tree.filter(x=>x.type==='blob');
 const subs=[...new Set(tree.filter(x=>/^[^\/]+-app\/package\.json$/.test(x.path)).map(x=>x.path.split('/')[0]))];
 const files=tree.filter(x=>CODE.test(x.path)&&!BAD.test(x.path)&&!/\.min\.js$|(^|\/)sw\.js$/.test(x.path)&&x.size<3e6);
 const read=async list=>(await Promise.all(list.map(x=>t(raw(r.name,br,x.path))))).join('\n');
 const feats=txt=>CATS.flatMap(([,,fs])=>fs.filter(([,kw])=>count(txt,kw)>=2).map(([fn])=>fn));
 let name=NAME[r.name.toLowerCase()];
 if(!name){const idx=tree.find(x=>/(^|\/)index\.html$/.test(x.path));const h=idx?await t(raw(r.name,br,idx.path)):'';name=((h.match(/<title>([^<]+)/)||[])[1]||r.name).trim()}
 systems.push({n:name,u:r.homepage||`https://${OWNER.toLowerCase()}.github.io/${r.name}/`,f:feats(await read(files.filter(x=>!subs.some(s=>x.path.startsWith(s+'/')))))});
 for(const s of subs){
  let nm=s;try{nm=JSON.parse(await t(raw(r.name,br,s+'/package.json'))).productName||s}catch(e){}
  systems.push({n:nm,u:`https://github.com/${OWNER}/${r.name}/releases`,f:feats(await read(files.filter(x=>x.path.startsWith(s+'/'))))});
 }
}
systems.sort((a,b)=>a.n.localeCompare(b.n,'zh-Hant'));
fs.writeFileSync(new URL('./data.json',import.meta.url),JSON.stringify({systems},null,1)+'\n');
console.log(systems.map(s=>s.n+' '+s.f.length).join('\n'));
