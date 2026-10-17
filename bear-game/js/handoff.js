
// Documented, versioned handoff boundary. No external AI credentials or automatic messaging.
function handoffText(){const e=ext();return `請接手「熊寶編年史 v22 戰況重製版」。\n\n目前功能：即時戰鬥、96 種夥伴、604 間餐食商店、181 個場景、鍛造／重鑄、裝備評分與自動配裝、冒險集章、32 種主動技能（上限 50）、10 種被動（上限 30）、PWA 離線快取、v19／v20 存檔遷移。\n\n修改規則：\n1. 主角固定熊寶，保留現有熊寶圖樣。\n2. 全部介面使用繁體中文，維持目前的文字呈現規則。\n3. 保留現有進度；變更資料結構時必須提供遷移，不可重置玩家紀錄。\n4. 保持免費、單機可玩，不加入付費 API。\n5. 先閱讀 CLAUDE.md、README.md、HANDOFF.md，並執行 tests/run.cjs。\n6. App 的交接介面為 window.BearChronicleApp（API 版本 1）；程式實作在 js/，資產在 assets/。\n\n目前進度摘要：熊寶 Lv.${player.level}、金幣 ${fmt(e.gold)}、出戰 ${e.party.length} 人、景點章 ${e.stamps.length} 枚、冒險完成 ${e.adventureCount} 次、裝備戰力 ${totalScore()}。完整進度請讀取我另附的 JSON。\n\n下一步需求：\n${document.getElementById('handoff-task').value.trim()||'請先檢查現有程式與測試，依我接下來提供的要求繼續開發。'}`;}
function openHandoff(){document.getElementById('handoffModal').style.display='block';document.getElementById('handoff-preview').value=handoffText();}
function downloadText(text,name,type='text/plain;charset=utf-8'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
async function copyHandoff(){const t=handoffText();document.getElementById('handoff-preview').value=t;try{await navigator.clipboard.writeText(t);notify('接手說明已複製。');}catch{document.getElementById('handoff-preview').focus();document.getElementById('handoff-preview').select();notify('請複製視窗內的接手說明。');}}
const APP_ACTIONS={
 optimize:()=>optimizeGear(),
 setProfile:p=>{if(!PROFILES[p.profile])throw Error('invalid-profile');ext().profile=p.profile;changed();return true;},
 craft:p=>craftGear(p),
 startAdventure:p=>startAdventure(p.sceneId,p.kind),
 claimAdventure:p=>claimAdventure(p.token),
 recruit:p=>recruit(p.id),
 trainSkill:p=>trainSkill(p.id),
 buyFood:p=>buyFood(p.id),
 useFood:p=>useFood(p.id),
 save:()=>saveGame(true),
 pause:p=>{ext().paused=!!p.paused;changed();return ext().paused;}
};
window.BearChronicleApp=Object.freeze({
 apiVersion:1,version:'21.0.0',
 getSnapshot:()=>JSON.parse(JSON.stringify(makeSave())),
 getCatalog:()=>({companions:COMPANIONS.map(c=>({id:c.id,name:c.name,role:c.role})),scenes:PENGHU_SOURCE.scenes.map(s=>({id:s.id,name:s.name,region:s.region})),foods:PENGHU_SOURCE.foods.map(f=>({id:f.id,name:f.name,category:f.category})),skills:Object.keys(EXT_SKILLS).map(id=>({id,name:SKILLS[id].name,maxLevel:MAX_SKILL_LEVEL}))}),
 exportJSON:()=>JSON.stringify(makeSave(),null,2),
 importJSON:(json)=>{const data=validateSave(JSON.parse(json));if(!confirm('接手介面要求匯入進度，確定取代目前紀錄？'))return false;applySave(data);saveGame(true);changed('進度已匯入。');return true;},
 dispatch:(action,payload={})=>{if(!Object.hasOwn(APP_ACTIONS,action))throw Error('unsupported-action');return APP_ACTIONS[action](payload);},
 openHandoff
});
let installPrompt=null;
document.addEventListener('DOMContentLoaded',()=>{
 document.getElementById('handoff-button').onclick=openHandoff;
 document.getElementById('handoff-copy').onclick=copyHandoff;
 document.getElementById('handoff-task').oninput=()=>document.getElementById('handoff-preview').value=handoffText();
 document.getElementById('handoff-export').onclick=()=>downloadText(handoffText(),'熊寶_Claude接手說明.txt');
 document.getElementById('handoff-save').onclick=exportSave;
 document.getElementById('handoffModal').onclick=e=>{if(e.target===e.currentTarget)e.currentTarget.style.display='none';};
 document.getElementById('install-button').onclick=async()=>{if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;document.getElementById('install-button').hidden=true;}else notify('App 可安裝時會顯示安裝按鈕；也可在瀏覽器選單選擇加入主畫面。');};
 if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;document.getElementById('install-button').hidden=false;});
window.addEventListener('appinstalled',()=>{installPrompt=null;document.getElementById('install-button').hidden=true;});

