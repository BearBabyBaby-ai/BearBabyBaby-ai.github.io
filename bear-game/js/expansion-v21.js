
// v21：澎湖資料快照、鍛造、冒險與裝備最佳化。
const V21_KEY='BearChronicleV21',MAX_SKILL_LEVEL=50,MAX_PASSIVE_LEVEL=30,MAX_COMPANION_LEVEL=50;
const EXTRA_SKILLS=[
 ['quick_slash','迅捷斬','Physical','Single',8,1.1,1,1,'連續追擊單體敵人。','風'],
 ['piercing','破甲突刺','Physical','Single',18,2.8,5,4,'集中力量貫穿單一目標。','金'],
 ['whirlwind','旋風斬','Physical','Area',24,1.7,5,6,'旋轉揮擊全體敵人。','風'],
 ['earth_shock','大地震擊','Physical','Area',32,2.3,7,12,'震擊地面攻擊全體敵人。','土'],
 ['moon_cut','月輪斬','Physical','Single',28,3.4,5,18,'月光般俐落的斬擊。','光明'],
 ['soul_bite','靈魂虹吸','Physical','Single',26,2.5,6,15,'造成傷害並吸收傷害值的 15% 為生命。','靈魂','drain'],
 ['tidal_fist','潮汐重拳','Physical','Single',30,4.1,7,22,'凝聚潮汐之力的重拳。','水'],
 ['dragon_break','龍影破空','Physical','Area',50,4.6,11,35,'龍影掠過全體敵人。','時空'],
 ['fireball','火球術','Magic','Single',12,1.6,2,2,'火焰打擊單體敵人。','火'],
 ['thunder','雷霆鎖鏈','Magic','Area',28,2.0,6,8,'雷霆在敵陣間跳躍。','雷'],
 ['frost_lance','寒冰槍','Magic','Single',20,2.7,4,10,'凝聚冰槍射向單體。','水'],
 ['vine_storm','森羅風暴','Magic','Area',26,2.1,6,12,'森羅靈力掃過全體。','木'],
 ['gold_ray','金光破邪','Magic','Single',30,3.6,6,18,'金光集中於單一目標。','金'],
 ['void_rift','虛空裂隙','Magic','Area',42,3.1,9,25,'時空裂隙吞沒敵陣。','時空'],
 ['dark_pulse','暗黑波動','Magic','Area',35,2.8,8,20,'暗黑能量衝擊全體。','暗黑'],
 ['mind_spear','心靈長矛','Magic','Single',38,4.4,7,28,'以心靈能量鎖定單體。','心靈'],
 ['soul_flame','靈魂之焰','Magic','Single',34,3.4,7,24,'造成法傷並吸收傷害值的 15% 為生命。','靈魂','drain'],
 ['dawn_nova','晨曦新星','Magic','Area',55,4.8,12,40,'晨曦星爆照耀整個敵陣。','光明'],
 ['spring_heal','回春甘霖','Heal','Self',16,1.8,4,5,'生命低於 55% 時自動治療。','木'],
 ['great_heal','聖光復甦','Heal','Self',36,5.0,9,20,'生命低於 55% 時施放強力治療。','光明'],
 ['mana_flow','魔力湧泉','Support','Self',0,.22,14,6,'恢復最大 MP 的 22%，等級提高恢復量。','水','mana'],
 ['stone_guard','磐石守護','Support','Self',20,2.4,12,8,'獲得以法攻與最大生命計算的護盾，持續 10 回合。','土','shield'],
 ['battle_focus','戰意凝聚','Support','Self',22,.12,16,16,'提升雙攻 12%，持續 10 回合；同類效果取較高者。','心靈','buff'],
 ['bear_bless','熊寶祝福','Support','Self',35,4.0,20,30,'強力護盾保護熊寶，持續 10 回合。','光明','shield']
];
for(const [id,name,type,target,cost,multiplier,cooldown,level,desc,element,effect]of EXTRA_SKILLS){SKILLS[id]={name,type,target,cost,multiplier,cooldown,isAuto:true,effect};EXT_SKILLS[id]={level,desc,element};}
Object.assign(PASSIVES,{
 vitality:{name:'健壯體魄',desc:'每級最大生命 +2%。'},wisdom:{name:'智慧泉源',desc:'每級最大魔力 +2%。'},
 recovery:{name:'生命律動',desc:'每級生命恢復 +4%。'},meditation:{name:'冥想',desc:'每級魔力恢復 +4%。'},
 precision:{name:'專注瞄準',desc:'每級物理與法術爆擊率 +0.4%。'},artisan:{name:'匠心',desc:'每級降低鍛造金幣成本 1%，最高 30%。'},
 explorer:{name:'探索心得',desc:'每級增加冒險結算金幣 2%。'}
});
const ROLES={guard:{label:'守護',icon:'🛡️',desc:'每級 +10 物防、+8 法防。'},archer:{label:'遠攻',icon:'🏹',desc:'每回合射擊單體；依物攻與夥伴等級成長。'},mage:{label:'法術',icon:'🔮',desc:'每 4 回合對全體敵人造成法術傷害。'},healer:{label:'療癒',icon:'🌿',desc:'每 4 回合恢復最大生命的 4%，每級成長。'},warrior:{label:'突擊',icon:'⚔️',desc:'每 2 回合斬擊單體；依物攻與夥伴等級成長。'},merchant:{label:'商旅',icon:'💰',desc:'每級增加擊殺金幣 10%、裝備販售收益 5%。'}};
function hash(s){let v=2166136261;for(const c of String(s)){v^=c.charCodeAt(0);v=Math.imul(v,16777619);}return v>>>0;}
function deityRole(name){if(/觀音|觀世音|藥師|保生|臨水|姑婆/.test(name))return 'healer';if(/土地|福德|趙公明|魯班/.test(name))return 'merchant';if(/玄天|真武|城隍|王爺|千歲/.test(name))return 'guard';if(/關聖|文衡|三太子|哪吒|將軍|武帥/.test(name))return 'warrior';if(/星君|太白|紫微/.test(name))return 'archer';return 'mage';}
for(const d of PENGHU_SOURCE.deities){const kind=deityRole(d.name),r=ROLES[kind];COMPANIONS.push({id:d.id,name:d.name,kind,icon:r.icon,role:r.label,cost:350+(hash(d.id)%6)*100,desc:r.desc,source:d});}
for(const c of COMPANIONS)if(!c.kind)c.kind=c.id;
const PROFILES={balanced:{name:'均衡',weights:{STR:2.5,INT:2.5,CON:3,AGI:1.2,LUK:.4,SPL:.4,PATK:1,MATK:1,PDEF:1.3,MDEF:1.3,MaxHP:.12,MaxMP:.12,Pcrit:2,Mcrit:2}},
 physical:{name:'物理',weights:{STR:4,INT:.8,CON:2,AGI:2,LUK:.5,SPL:.4,PATK:2,MATK:.25,PDEF:1,MDEF:.8,MaxHP:.1,MaxMP:.08,Pcrit:4,Mcrit:.4}},
 magic:{name:'法術',weights:{STR:.8,INT:4.5,CON:2,AGI:.8,LUK:.4,SPL:.4,PATK:.25,MATK:2,PDEF:.8,MDEF:1,MaxHP:.1,MaxMP:.2,Pcrit:.4,Mcrit:4}},
 tank:{name:'坦克',weights:{STR:1,INT:1.4,CON:5,AGI:1.6,LUK:.2,SPL:.2,PATK:.5,MATK:.5,PDEF:2.5,MDEF:2.5,MaxHP:.25,MaxMP:.08,Pcrit:.5,Mcrit:.5}}};
const ADVENTURE_TYPES={explore:{name:'踏查探索',ticks:20,kills:3,mult:.8,gold:180,ore:5,dust:5},escort:{name:'守護委託',ticks:35,kills:8,mult:1.1,gold:400,ore:10,dust:12},boss:{name:'幻境首領',ticks:50,kills:12,mult:1.4,gold:800,ore:18,dust:25}};
let pageView='battle',viewPage=1,viewQuery='',viewRegion='',guildTab='food',tickBatch=false,autoSaving=false,lastManualTick=-1,sessionTick=0;
const migratePlayer20=migratePlayer;
migratePlayer=function(){
 migratePlayer20();const e=ext();e.version=21;
 for(const k of ['ore','forgeXP','adventureCount'])e[k]=nint(e[k]);
 if(!e.v21Gift){e.v21Gift=true;e.ore+=20;e.dust+=20;}
 e.profile=PROFILES[e.profile]?e.profile:'balanced';e.autoOptimize=e.autoOptimize===true;
 e.sceneId=PENGHU_SOURCE.scenes.some(s=>s.id===e.sceneId)?e.sceneId:PENGHU_SOURCE.scenes[0].id;
 e.stamps=Array.isArray(e.stamps)?[...new Set(e.stamps)].filter(id=>PENGHU_SOURCE.scenes.some(s=>s.id===id)):[];
 e.foodBag=e.foodBag&&typeof e.foodBag==='object'?e.foodBag:{};e.foodStocks=e.foodStocks&&typeof e.foodStocks==='object'?e.foodStocks:{};
 for(const id of Object.keys(e.foodBag)){if(!PENGHU_SOURCE.foods.some(f=>f.id===id))delete e.foodBag[id];else e.foodBag[id]=nint(e.foodBag[id],0,99);}
 e.buffs=e.buffs&&typeof e.buffs==='object'?e.buffs:{};
 for(const k of ['food','focus']){const b=e.buffs[k];e.buffs[k]=b&&typeof b==='object'?{ticks:nint(b.ticks,0,600),power:Math.min(.75,Math.max(0,Number(b.power)||0)),gold:Math.min(.5,Math.max(0,Number(b.gold)||0))}:null;}
 e.barrier=Math.min(1e9,nint(e.barrier));e.barrierTicks=nint(e.barrierTicks,0,10);
 e.skillPriority=Array.isArray(e.skillPriority)?[...new Set(e.skillPriority)].filter(id=>EXT_SKILLS[id]):Object.keys(EXT_SKILLS);
 for(const id of Object.keys(EXT_SKILLS))if(!e.skillPriority.includes(id))e.skillPriority.push(id);
 const enabled=Object.keys(EXT_SKILLS).filter(id=>e.skillRanks[id]>0&&player.autoSkills[id]);for(const id of enabled.slice(6))player.autoSkills[id]=false;
 if(e.run&&(!ADVENTURE_TYPES[e.run.kind]||!['active','ready'].includes(e.run.status)||!PENGHU_SOURCE.scenes.some(s=>s.id===e.run.sceneId)))e.run=null;
 if(e.run){e.run.ticks=nint(e.run.ticks,0,100000);e.run.kills=nint(e.run.kills,0,100000);e.run.rewardLevel=Math.max(1,nint(e.run.rewardLevel,player.level,10000));e.run.token=typeof e.run.token==='string'?e.run.token:newId();e.run.bossDefeated=!!e.run.bossDefeated;e.run.bossSpawned=false;}
 // Canonical IDs across equipped items and bag prevent duplicate sale/equipment claims after a malformed import.
 for(const slot of Object.keys(player.equipment))if(!Object.hasOwn(EQUIPMENT_SLOTS,slot))delete player.equipment[slot];
 const seen=new Set();for(const i of [...Object.values(player.equipment).filter(Boolean),...player.inventory]){if(seen.has(String(i.id)))i.id=newId();seen.add(String(i.id));}
 for(const key of ['allocatedSTR','allocatedINT','allocatedCON','allocatedAGI','StatPoints','exp'])player[key]=nint(player[key],0,1e9);
 e.uiEpoch=0;
};
function roleRank(kind){return ext().party.reduce((sum,id)=>sum+(COMPANIONS.find(c=>c.id===id)?.kind===kind?(ext().companions[id]||0):0),0);}
partyRank=function(id){return ROLES[id]?roleRank(id):(ext().party.includes(id)?ext().companions[id]||0:0);};
function currentScene(){return PENGHU_SOURCE.scenes.find(s=>s.id===ext().sceneId)||PENGHU_SOURCE.scenes[0];}
function scoreItem(i,profile=ext().profile){if(!i)return 0;const weights=PROFILES[profile]?.weights||PROFILES.balanced.weights;return Math.round(Object.entries(getItemStats(i)).reduce((s,[k,v])=>s+v*(weights[k]||0),0)*10)/10;}
function totalScore(){return Math.round(Object.values(player.equipment).filter(Boolean).reduce((s,i)=>s+scoreItem(i),0)*10)/10;}
function comparison(i){const old=player.equipment[i.slot],delta=Math.round((scoreItem(i)-scoreItem(old))*10)/10;return {score:scoreItem(i),delta,better:delta>0&&i.minLevel<=player.level};}
function optimizeGear(silent=false){
 let count=0;for(const slot of Object.keys(EQUIPMENT_SLOTS)){const old=player.equipment[slot];if(old?.locked)continue;
 const best=player.inventory.filter(i=>i.slot===slot&&!i.locked&&i.minLevel<=player.level).sort((a,b)=>scoreItem(b)-scoreItem(a)||String(a.id).localeCompare(String(b.id)))[0];
 if(!best||scoreItem(best)<=scoreItem(old))continue;
 player.inventory=player.inventory.filter(i=>i.id!==best.id);if(old)player.inventory.push(old);player.equipment[slot]=best;count++;
 }
 if(count)calculateStats();if(!silent)changed(count?`依「${PROFILES[ext().profile].name}」評分最佳化 ${count} 個部位。`:'目前已是可穿戴、未鎖定裝備中的最佳組合。');return count;
}
const calculateStats20=calculateStats;
calculateStats=function(){calculateStats20();if(!player.extension?.v21Gift)return;const e=ext();
 player.maxHP=Math.floor(player.maxHP*(1+e.passives.vitality*.02));player.maxMP=Math.floor(player.maxMP*(1+e.passives.wisdom*.02));
 player.HPRegen*=1+e.passives.recovery*.04;player.MPRegen*=1+e.passives.meditation*.04;
 player.PCrit=Math.min(95,player.PCrit+e.passives.precision*.4);player.MCrit=Math.min(95,player.MCrit+e.passives.precision*.4);
 const power=Math.max(e.buffs.focus?.ticks>0?e.buffs.focus.power:0,e.buffs.food?.ticks>0?e.buffs.food.power:0);
 player.PATK=Math.floor(player.PATK*(1+power));player.MATK=Math.floor(player.MATK*(1+power));
 player.currentHP=Math.min(player.maxHP,Math.max(0,player.currentHP));player.currentMP=Math.min(player.maxMP,Math.max(0,player.currentMP));
};
// Preserve v20 experience and item formula; sanitize tooltip/log text at the import boundary.
const normalizeItem20=normalizeItem;
normalizeItem=function(i){normalizeItem20(i);i.name=i.name.replace(/[<>]/g,'');};
const updatePlayerUI20=updatePlayerUI,updateMonsterUI20=updateMonsterUI;
updatePlayerUI=function(){if(tickBatch)return;updatePlayerUI20();if(!player.extension?.v21Gift)return;document.getElementById('wallet-ore').textContent=fmt(ext().ore);document.getElementById('hero-score').textContent=fmt(totalScore());
 if(player.isDefeated)document.getElementById('cooldown-status').textContent=`❌ 復活倒數 ${player.defeatCooldown||0} 回合`;
 document.getElementById('hero-party').textContent=`${ext().party.length}/3 夥伴 · ${ext().stamps.length}/${PENGHU_SOURCE.scenes.length} 景點章`;
 updateAdventureUI();
};
updateMonsterUI=function(){if(!tickBatch)updateMonsterUI20();};
const renderEquipmentSlots20=renderEquipmentSlots,renderEquipmentBonusSummary20=renderEquipmentBonusSummary;
renderEquipmentSlots=function(){if(document.getElementById('statsModal').style.display!=='block')return;renderEquipmentSlots20();const cards=document.getElementById('equipment-slots-grid').children;Object.keys(EQUIPMENT_SLOTS).forEach((slot,idx)=>{const i=player.equipment[slot];if(i){const label=document.createElement('div');label.className='gear-score';label.textContent=`裝備評分 ${fmt(scoreItem(i))}`;cards[idx].append(label);}});};
renderEquipmentBonusSummary=function(){if(document.getElementById('statsModal').style.display==='block')renderEquipmentBonusSummary20();};
const renderInventory20=renderInventory;
renderInventory=function(){if(!player.extension?.v21Gift)return;renderInventory20();const filter=player.inventory.filter(i=>inventoryFilter==='ALL'||i.tier===inventoryFilter),items=filter.slice((inventoryCurrentPage-1)*30,inventoryCurrentPage*30);
 const list=document.getElementById('inventory-list');items.forEach((i,idx)=>{const c=comparison(i),row=document.createElement('div');row.className='gear-compare '+(c.better?'positive':'');row.textContent=`評分 ${fmt(c.score)} · 同部位 ${c.delta>=0?'+':''}${c.delta.toFixed(1)}${i.minLevel>player.level?' · 等級不足':''}`;list.children[idx]?.append(row);});
 const profile=document.getElementById('gear-profile');if(profile)profile.value=ext().profile;document.getElementById('gear-auto').checked=ext().autoOptimize;
};
changed=function(message){ext().uiEpoch++;calculateStats();updatePlayerUI();if(document.getElementById('statsModal').style.display==='block')renderInventory();renderSkills();renderSystem();if(message){notify(message);logCombat(esc(message),'log-status');}if(autoSaveEnabled&&!autoSaving){autoSaving=true;saveGame(true);autoSaving=false;}};
function safeURL(url){try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:'';}catch{return '';}}
function panelIntro(title,description){const box=document.createElement('div');box.className='system-intro';box.innerHTML=`<div class="eyebrow">BEAR CHRONICLE / 澎湖冒險誌</div><h2>${esc(title)}</h2><p>${description}</p>`;return box;}
function card(html,cls=''){const n=document.createElement('article');n.className='system-card '+cls;n.innerHTML=html;return n;}
function setView(tab){viewPage=1;viewQuery='';viewRegion='';openSystem(tab);}
openSystem=function(tab){
 if(tab==='equipment'){document.getElementById('open-stats').click();renderEquipmentSlots();renderEquipmentBonusSummary();renderInventory();return;}
 pageView=tab;activeSystem=tab;document.getElementById('main-game').style.display=tab==='battle'?'grid':'none';document.getElementById('systemsModal').style.display=tab==='battle'?'none':'block';
 document.querySelectorAll('[data-system]').forEach(b=>{b.classList.toggle('active',b.dataset.system===tab);b.setAttribute('aria-pressed',b.dataset.system===tab);});
 if(tab!=='battle')renderSystem();
};
function filteredRows(rows,getText){const q=viewQuery.trim().toLowerCase();return rows.filter(r=>(!viewRegion||r.region===viewRegion)&&(!q||getText(r).toLowerCase().includes(q)));}
function addFilters(parent,regions=true,placeholder='輸入名稱或區域搜尋'){
 const tools=document.createElement('div');tools.className='catalog-tools';
 const input=document.createElement('input');input.type='search';input.value=viewQuery;input.placeholder=placeholder;input.setAttribute('aria-label',placeholder);input.id='catalog-query';
 // Search commits on Enter or the search button so combat updates never interrupt typing.
 const commit=()=>{viewQuery=input.value;viewPage=1;renderSystem();};input.onkeydown=e=>{if(e.key==='Enter')commit();};tools.append(input,button('搜尋',commit));
 if(regions){const select=document.createElement('select');select.setAttribute('aria-label','篩選鄉市');select.innerHTML='<option value="">全部鄉市</option>'+[...new Set([...PENGHU_SOURCE.scenes,...PENGHU_SOURCE.foods].map(r=>r.region))].map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');select.value=viewRegion;select.onchange=()=>{viewRegion=select.value;viewPage=1;renderSystem();};tools.append(select);}
 parent.append(tools);
}
function addPagination(parent,total,size=12){const pages=Math.max(1,Math.ceil(total/size));viewPage=Math.max(1,Math.min(pages,viewPage));const nav=document.createElement('div');nav.className='catalog-pages';const label=document.createElement('span');label.textContent=`共 ${total} 筆 · 第 ${viewPage} / ${pages} 頁`;nav.append(button('上一頁',()=>{viewPage--;renderSystem();},viewPage<=1),label,button('下一頁',()=>{viewPage++;renderSystem();},viewPage>=pages));parent.append(nav);return (viewPage-1)*size;}
function partySetAuto(id,enabled){if(!(ext().skillRanks[id]>0))return;if(enabled&&Object.keys(EXT_SKILLS).filter(k=>ext().skillRanks[k]>0&&player.autoSkills[k]).length>=6){notify('最多啟用 6 種自動技能，請先停用其他技能。');renderSkills();renderSystem();return;}player.autoSkills[id]=enabled;changed();}
function learnLevelCost(id){const r=ext().skillRanks[id]||0;return {gold:120*(r+1),skillPoints:r?Math.max(1,Math.ceil((r+1)/10)):1};}
learnCost=learnLevelCost;
trainSkill=function(id){if(!EXT_SKILLS[id])return;const r=ext().skillRanks[id]||0;if(r>=MAX_SKILL_LEVEL||player.level<EXT_SKILLS[id].level)return;if(!spend(learnCost(id)))return;ext().skillRanks[id]=r+1;if(!r&&Object.keys(EXT_SKILLS).filter(k=>player.autoSkills[k]).length<6)player.autoSkills[id]=true;changed(`${SKILLS[id].name} 提升至 Lv.${r+1}。`);};
trainPassive=function(id){if(!PASSIVES[id])return;const r=ext().passives[id];if(r>=MAX_PASSIVE_LEVEL)return;if(!spend({gold:(r+1)*200,skillPoints:Math.max(1,Math.ceil((r+1)/8))}))return;ext().passives[id]++;changed(`${PASSIVES[id].name} 提升至 Lv.${r+1}。`);};
effectiveSkill=function(id){const s=SKILLS[id],r=ext().skillRanks[id]||0;return {...s,multiplier:s.multiplier*(1+Math.max(0,r-1)*.08)};};
renderSkills=function(){if(!player.extension?.v21Gift)return;const area=document.getElementById('skill-area');area.replaceChildren();const enabled=Object.keys(EXT_SKILLS).filter(id=>ext().skillRanks[id]>0&&player.autoSkills[id]);const desc=document.createElement('p');desc.className='bear-muted';desc.textContent=`自動技能 ${enabled.length} / 6 · 危急時優先治療，MP 不足時普攻。`;area.append(desc);
 for(const id of enabled){const row=document.createElement('label');row.className='bear-skill-row';row.innerHTML=`<span><strong>${SKILLS[id].name} Lv.${ext().skillRanks[id]}</strong><small>MP ${SKILLS[id].cost} · CD ${skillCooldowns[id]||0} / ${SKILLS[id].cooldown} 回合</small></span>`;const cb=document.createElement('input');cb.type='checkbox';cb.checked=true;cb.onchange=()=>partySetAuto(id,cb.checked);row.append(cb);area.append(row);}area.append(button('前往技能研習',()=>setView('skills')));
};
const useSkill20=useSkill;
useSkill=function(skill,target,id){
 if(id!=='basic_attack'&&(!(ext().skillRanks[id]>0)||(skillCooldowns[id]||0)>0||player.currentMP<skill.cost||player.isDefeated))return false;
 if(skill.type==='Support'){
  player.currentMP-=skill.cost;skillCooldowns[id]=skill.cooldown;
  if(skill.effect==='mana')player.currentMP=Math.min(player.maxMP,player.currentMP+Math.floor(player.maxMP*Math.min(.65,skill.multiplier)));
  if(skill.effect==='shield'){ext().barrier=Math.max(ext().barrier,Math.floor(player.MATK*skill.multiplier+player.maxHP*.1));ext().barrierTicks=10;}
  if(skill.effect==='buff')ext().buffs.focus={ticks:10,power:Math.min(.5,skill.multiplier),gold:0};
  calculateStats();logCombat(`✦ 熊寶施放 ${esc(skill.name)}。`,'log-heal');updatePlayerUI();return true;
 }
 const live=Array.isArray(target)?target.filter(m=>m.currentHP>0&&!m.rewarded):target&&target.currentHP>0&&!target.rewarded?[target]:[];
 if(skill.type!=='Heal'&&!live.length)return false;
 const oldHP=live.reduce((s,m)=>s+m.currentHP,0),ok=useSkill20(skill,skill.type==='Heal'?null:skill.target==='Area'?live:live[0],id);
 if(ok&&skill.effect==='drain'){const dealt=oldHP-live.reduce((s,m)=>s+Math.max(0,m.currentHP),0);player.currentHP=Math.min(player.maxHP,player.currentHP+Math.floor(dealt*.15));}
 return ok;
};
performAutoSkills=function(target,isAttempt=false){
 const ids=ext().skillPriority.filter(id=>ext().skillRanks[id]>0&&player.autoSkills[id]&&(skillCooldowns[id]||0)<=0&&player.currentMP>=SKILLS[id].cost);
 const heals=ids.filter(id=>SKILLS[id].type==='Heal'),support=ids.filter(id=>SKILLS[id].type==='Support');
 let chosen=player.currentHP/player.maxHP<.55?heals[0]:null;
 if(!chosen)chosen=support.find(id=>SKILLS[id].effect==='mana'?player.currentMP/player.maxMP<.35:SKILLS[id].effect==='shield'?ext().barrier<=0:!(ext().buffs.focus?.ticks>0));
 if(!chosen)chosen=ids.find(id=>!['Heal','Support'].includes(SKILLS[id].type));if(!chosen)return false;
 if(!isAttempt)useSkill(effectiveSkill(chosen),SKILLS[chosen].type==='Heal'||SKILLS[chosen].type==='Support'?null:SKILLS[chosen].target==='Area'?monsters.filter(m=>m.currentHP>0):target,chosen);return true;
};
manualSkill=function(id){if(ext().paused){notify('請先繼續戰鬥，再手動施放技能。');return;}if(lastManualTick===sessionTick){notify('每回合最多手動施放一次技能。');return;}const s=SKILLS[id];if(!s||!ext().skillRanks[id]||player.isDefeated)return;
 if((skillCooldowns[id]||0)>0){notify('技能仍在冷卻中。');return;}if(player.currentMP<s.cost){notify('MP 不足。');return;}
 const targets=monsters.filter(m=>m.currentHP>0);if(useSkill(effectiveSkill(id),['Heal','Support'].includes(s.type)?null:s.target==='Area'?targets:targets[0],id)){lastManualTick=sessionTick;renderSystem();}
};
monsterAttack=function(m){if(m.currentHP<=0||m.rewarded||player.isDefeated)return;if(m.attackCooldown>0){m.attackCooldown--;return;}if(player.currentHP<=0)return;
 let dmg=Math.max(1,Math.floor(m.PATK*(1-player.PDR/100))),absorbed=Math.min(ext().barrier||0,dmg);ext().barrier-=absorbed;dmg-=absorbed;player.currentHP=Math.max(0,player.currentHP-dmg);m.attackCooldown=2;logCombat(`${esc(m.name)} 造成 ${fmt(dmg)} 傷害${absorbed?`，護盾吸收 ${fmt(absorbed)}`:''}。`,'log-default');
};
companionsAct=function(){companionTicks++;for(const id of ext().party){const r=ext().companions[id]||0,c=COMPANIONS.find(c=>c.id===id);if(!r||!c)continue;const kind=c.kind;
 if(kind==='healer'&&companionTicks%4===0){const gain=Math.floor(player.maxHP*Math.min(.5,.04*r));player.currentHP=Math.min(player.maxHP,player.currentHP+gain);logCombat(`${c.icon} ${esc(c.name)} 恢復 ${fmt(gain)} 生命。`,'log-heal');continue;}
 if(!['archer','mage','warrior'].includes(kind)||(kind==='mage'&&companionTicks%4)||(kind==='warrior'&&companionTicks%2))continue;
 const live=monsters.filter(m=>m.currentHP>0&&!m.rewarded),targets=kind==='mage'?live:live.slice(0,1);
 for(const m of targets){const raw=kind==='mage'?(20+player.MATK*.5)*r:kind==='warrior'?(25+player.PATK*.7)*r:(12+player.PATK*.35)*r;const def=kind==='mage'?m.MDEF:m.PDEF;const dmg=Math.max(1,Math.floor(raw*100/(100+Math.max(0,def||0))));m.currentHP-=dmg;logCombat(`${c.icon} ${esc(c.name)} 造成 ${fmt(dmg)} 傷害。`,'log-skill-phys');if(m.currentHP<=0)handleMonsterDefeat(m);}
 }};
const createMonster20=createMonster;
createMonster=function(level){const m=createMonster20(level),run=player.extension?.run;if(run?.status==='active'){const scale=ADVENTURE_TYPES[run.kind].mult;m.maxHP=Math.ceil(m.maxHP*scale);m.currentHP=m.maxHP;m.PATK=Math.ceil(m.PATK*scale);}return m;};
const spawnMonster20=spawnMonster;
spawnMonster=function(){spawnMonster20();const r=player.extension?.run;if(r?.status==='active'&&r.kind==='boss'&&!r.bossDefeated&&!r.bossSpawned){const boss=createMonster();boss.name='[幻境首領] 虛空守門者';boss.maxHP*=3;boss.currentHP=boss.maxHP;boss.PATK=Math.ceil(boss.PATK*1.4);boss.expValue*=3;boss.isSpecial=true;boss.runToken=r.token;r.bossSpawned=true;monsters.unshift(boss);}};
const handleMonsterDefeat20=handleMonsterDefeat;
handleMonsterDefeat=function(m){if(m.rewarded)return;const e=ext(),r=e.run;
 if(r?.status==='active'&&r.sceneId===e.sceneId){r.kills++;if(m.runToken===r.token)r.bossDefeated=true;}
 const bonus=e.buffs.food?.ticks>0?e.buffs.food.gold:0;if(bonus)e.gold+=Math.floor((10+m.level*3)*bonus);
 if(Math.random()<.18){e.ore++;logCombat('⛏ 獲得鍛造礦石 ×1。','log-item-drop');}
 handleMonsterDefeat20(m);checkAdventure();
};
const handleItemDrop20=handleItemDrop;
handleItemDrop=function(m){handleItemDrop20(m);if(ext().autoOptimize)optimizeGear(true);};
const gameLoop20=gameLoop;
gameLoop=function(){if(ext().paused)return;sessionTick++;const wasDefeated=player.isDefeated;tickBatch=true;
 try{gameLoop20();if(!wasDefeated&&!player.isDefeated){for(const key of ['food','focus'])if(ext().buffs[key]?.ticks>0)ext().buffs[key].ticks--;if(ext().barrierTicks>0&&--ext().barrierTicks===0)ext().barrier=0;if(ext().run?.status==='active')ext().run.ticks++;checkAdventure();}calculateStats();}
 finally{tickBatch=false;}updatePlayerUI();updateMonsterUI();renderSkills();
};
function forgeCost(level,tier,qty=1){const t=Number(tier.slice(1)),discount=1-ext().passives.artisan*.01;return {gold:Math.ceil((80+level*15)*(t+1)**2*discount)*qty,dust:(t+1)*3*qty,crystal:Math.max(0,t-1)*qty,ore:(t+1)*qty};}
function craftGear(options){const {slot,tier}=options,level=Number(options.level),qty=Number(options.qty);if(!Object.hasOwn(EQUIPMENT_SLOTS,slot)||!Object.hasOwn(TIER_CONFIG,tier)||!Number.isInteger(level)||level<1||level>player.level||![1,5,10].includes(qty)){notify('鍛造選項無效，請重新確認。');return false;}
 if(player.inventory.length+qty>player.level*MAX_INVENTORY_MULTIPLIER){notify('背包空間不足，這批鍛造尚未扣款。');return false;}const cost=forgeCost(level,tier,qty);if(!afford(cost)){notify('鍛造材料不足。');return false;}
 const items=Array.from({length:qty},()=>{const i=makeItem(level,tier,slot),keys=Object.keys(i.baseStats);for(const k of keys)i.baseStats[k]=Math.max(1,Math.floor(i.baseStats[k]*(.9+Math.random()*.3)));i.stats={...i.baseStats};return i;});if(!spend(cost))return false;player.inventory.push(...items);ext().forgeXP+=qty*(Number(tier.slice(1))+1);if(ext().autoOptimize)optimizeGear(true);changed(`成功鍛造 ${qty} 件 ${EQUIPMENT_SLOTS[slot]}。`);return true;
}
function recastGear(id){const i=byId(id);if(!i||i.locked||!player.inventory.some(x=>x.id===i.id)){notify('僅可重鑄背包內未鎖定的裝備。');return;}const cost={gold:100+i.minLevel*15,dust:8,ore:2};if(!confirm(`重鑄 ${i.name}？\n消耗 ${cost.gold} 金幣、8 粉塵、2 礦石。\n會重抽基礎屬性，結果可能降低；保留等級、位階與強化。`))return;
 if(!spend(cost))return;const base=makeItem(i.minLevel,i.tier,i.slot),stat=['STR','INT','CON','AGI'][hash(newId())%4];base.baseStats[stat]=Math.ceil((i.minLevel+1)*(1+Number(i.tier.slice(1))*.35));i.baseStats=base.baseStats;i.stats={...i.baseStats};changed('裝備重鑄完成。');
}
function travelScene(id){const s=PENGHU_SOURCE.scenes.find(x=>x.id===id);if(!s)return false;if(ext().run){notify('請先完成或放棄目前冒險，再更換場景。');return false;}ext().sceneId=id;spawnMonster();renderZoneUI();changed(`抵達 ${s.name}。`);return true;}
function startAdventure(id,kind){if(!ADVENTURE_TYPES[kind]||!PENGHU_SOURCE.scenes.some(s=>s.id===id))return false;if(ext().run){notify('已有冒險進行中；完成領獎或放棄後再開始。');return false;}if(player.isDefeated){notify('熊寶復活後即可開始冒險。');return false;}
 ext().sceneId=id;ext().run={token:newId(),kind,sceneId:id,status:'active',ticks:0,kills:0,bossSpawned:false,bossDefeated:false,startedAt:Date.now(),rewardLevel:player.level};ext().paused=false;spawnMonster();renderZoneUI();changed(`冒險開始：${ADVENTURE_TYPES[kind].name}。`);openSystem('battle');return true;
}
function checkAdventure(){const r=ext().run;if(!r||r.status!=='active')return;const t=ADVENTURE_TYPES[r.kind];if(r.ticks>=t.ticks&&r.kills>=t.kills&&(r.kind!=='boss'||r.bossDefeated)){r.status='ready';notify('冒險完成！可領取獎勵與景點章。');if(autoSaveEnabled)saveGame(true);}}
function adventureReward(r){const t=ADVENTURE_TYPES[r.kind];return {gold:Math.floor((t.gold+r.rewardLevel*15)*(1+ext().passives.explorer*.02)),ore:t.ore,dust:t.dust,crystal:r.kind==='boss'?3:1};}
function claimAdventure(token){const r=ext().run;if(!r||r.token!==token||r.status!=='ready')return false;const reward=adventureReward(r);r.status='claimed';for(const [k,v]of Object.entries(reward))ext()[k]+=v;ext().adventureCount++;if(!ext().stamps.includes(r.sceneId))ext().stamps.push(r.sceneId);ext().run=null;changed(`冒險結算：${fmt(reward.gold)} 金幣、${reward.ore} 礦石、${reward.dust} 粉塵、${reward.crystal} 結晶。`);return true;}
function abandonAdventure(token){if(!ext().run||ext().run.token!==token)return;if(!confirm('確定放棄這次冒險？本次進度與未領取獎勵將清除。'))return;ext().run=null;spawnMonster();changed('已放棄本次冒險。');}
const renderZoneUI20=renderZoneUI;
renderZoneUI=function(){renderZoneUI20();if(!player.extension?.v21Gift)return;document.getElementById('current-zone-name').textContent=currentScene().name+' · '+ZONE_CONFIGS[currentZoneIndex].name;};
function updateAdventureUI(){const s=currentScene(),r=ext().run;document.getElementById('scene-name').textContent=s.name;document.getElementById('scene-region').textContent=s.region+' / '+s.village+' · '+s.category;document.getElementById('scene-description').textContent=s.description||'來一場熊寶的海島探索。';
 const node=document.getElementById('adventure-live');node.replaceChildren();if(!r){node.innerHTML='<strong>旅途待啟程</strong><span>挑選景點，完成探索與收集景點章。</span>';node.append(button('選擇冒險場景 →',()=>setView('adventure')));return;}
 const t=ADVENTURE_TYPES[r.kind];node.innerHTML=`<strong>${t.name} · ${r.status==='ready'?'已完成':'進行中'}</strong><span>戰鬥回合 ${Math.min(r.ticks,t.ticks)} / ${t.ticks}　擊敗敵人 ${Math.min(r.kills,t.kills)} / ${t.kills}${r.kind==='boss'?`　首領 ${r.bossDefeated?'已擊敗':'未擊敗'}`:''}</span><progress value="${Math.min(1,r.ticks/t.ticks,r.kills/t.kills)}" max="1"></progress>`;
 node.append(button(r.status==='ready'?'領取冒險獎勵':'查看冒險',()=>r.status==='ready'?claimAdventure(r.token):setView('adventure'),false,r.status==='ready'?'primary':''));
}
function foodInfo(f){const mana=/飲料|冰|咖啡|茶|酒吧/.test(f.category),amount=mana?.28:.35;return {price:shopPrice(45+hash(f.id)%8*10),hp:mana?.12:amount,mp:mana?amount:.12,power:mana?0:.08,gold:mana?.1:0};}
function foodStock(f){const day=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Taipei'}),old=ext().foodStocks[f.id];if(!old||old.day!==day)ext().foodStocks[f.id]={day,left:5};else old.left=nint(old.left,0,5);return ext().foodStocks[f.id];}
function buyFood(id){const f=PENGHU_SOURCE.foods.find(x=>x.id===id);if(!f)return false;const stock=foodStock(f),n=ext().foodBag[id]||0;if(stock.left<1||n>=99){notify('本日遊戲庫存已售完，或背包已達 99 份。');return false;}const info=foodInfo(f);if(!spend({gold:info.price}))return false;stock.left--;ext().foodBag[id]=n+1;ext().guildXP+=2;changed(`已向 ${f.name} 購買冒險餐食。`);return true;}
function useFood(id){const f=PENGHU_SOURCE.foods.find(x=>x.id===id);if(!f||!(ext().foodBag[id]>0)||player.isDefeated)return false;const info=foodInfo(f);ext().foodBag[id]--;player.currentHP=Math.min(player.maxHP,player.currentHP+Math.floor(player.maxHP*info.hp));player.currentMP=Math.min(player.maxMP,player.currentMP+Math.floor(player.maxMP*info.mp));ext().buffs.food={ticks:60,power:info.power,gold:info.gold};changed(`享用 ${f.name} 的餐食，恢復體力並獲得 60 戰鬥回合加成。`);return true;}
upgradeCompanion=function(id){const c=COMPANIONS.find(x=>x.id===id),r=ext().companions[id];if(!c||!r||r>=MAX_COMPANION_LEVEL)return;if(!spend({gold:Math.ceil(c.cost*r*.65),dust:r*3}))return;ext().companions[id]++;changed(`${c.name} 提升至 Lv.${r+1}。`);};
const buyOffer20=buyOffer;
buyOffer=function(index,expectedId){const o=ext().offers[index];if(expectedId&&String(o?.item.id)!==String(expectedId)){notify('商品已更新，請重新選擇。');return;}buyOffer20(index);};
function renderAdventure(parent){
 parent.append(panelIntro('每一處風景，都是新的冒險',`走訪 ${PENGHU_SOURCE.scenes.length} 處景點，累積專屬於熊寶的旅行印章。所有戰鬥與任務皆為幻想遊戲情節。`));
 const r=ext().run;if(r){const scene=PENGHU_SOURCE.scenes.find(s=>s.id===r.sceneId),t=ADVENTURE_TYPES[r.kind],reward=adventureReward(r);const active=card(`<span class="bear-tag">${r.status==='ready'?'可領取獎勵':'冒險進行中'}</span><h3>${esc(scene.name)} · ${t.name}</h3><p>回合 ${r.ticks} / ${t.ticks} · 擊敗敵人 ${r.kills} / ${t.kills}${r.kind==='boss'?` · 首領${r.bossDefeated?'已擊敗':'未擊敗'}`:''}</p><div class="bear-muted">結算 ${fmt(reward.gold)} 金幣、${reward.ore} 礦石、${reward.dust} 粉塵、${reward.crystal} 結晶</div>`,'active-adventure');active.append(button(r.status==='ready'?'領取獎勵與景點章':'返回即時戰鬥',()=>r.status==='ready'?claimAdventure(r.token):setView('battle'),false,'primary'),button('放棄這次冒險',()=>abandonAdventure(r.token)));parent.append(active);}
 addFilters(parent,true,'搜尋景點、村里或分類');const rows=filteredRows(PENGHU_SOURCE.scenes,s=>[s.name,s.village,s.region,s.category,s.description].join(' ')),start=addPagination(parent,rows.length),grid=document.createElement('div');grid.className='system-grid scene-grid';
 for(const s of rows.slice(start,start+12)){const stamp=ext().stamps.includes(s.id),active=ext().sceneId===s.id,el=card(`<div class="scene-card-art" data-theme="${hash(s.region)%4}"><span>${stamp?'✓ 已集章':s.category}</span><strong>${esc(s.name)}</strong></div><div class="eyebrow">${esc(s.region)} / ${esc(s.village)}</div><h3>${esc(s.name)}</h3><p>${esc(s.description||'與熊寶一起慢慢探索這個角落。')}</p>`);
  const select=document.createElement('select');select.setAttribute('aria-label',s.name+'冒險類型');select.innerHTML=Object.entries(ADVENTURE_TYPES).map(([id,t])=>`<option value="${id}">${t.name} · ${t.ticks} 回合 / ${t.kills} 敵人</option>`).join('');el.append(select);
  const acts=document.createElement('div');acts.className='bear-actions';acts.append(button(active?'目前場景':'前往場景',()=>travelScene(s.id),!!r||active),button('開始冒險',()=>startAdventure(s.id,select.value),!!r||player.isDefeated,'primary'));el.append(acts);const url=safeURL(s.url);if(url){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='地點資訊 ↗';el.append(a);}grid.append(el);
 }if(!rows.length)grid.innerHTML='<p class="bear-empty">沒有符合條件的景點，請調整搜尋。</p>';parent.append(grid);
}
function renderForge(parent){parent.append(panelIntro('熊寶鍛造工坊',`挑選部位、位階與等級，鍛造適合自己的裝備。工匠經驗 ${fmt(ext().forgeXP)} · 礦石 ${fmt(ext().ore)}。鍛造必定成功；強化、升級與升階可在裝備頁操作。`));
 const form=document.createElement('div');form.className='forge-form';form.innerHTML=`<label>裝備部位<select id="forge-slot">${Object.entries(EQUIPMENT_SLOTS).map(([id,n])=>`<option value="${id}">${n}</option>`).join('')}</select></label><label>裝備位階<select id="forge-tier">${Object.entries(TIER_CONFIG).map(([id,t])=>`<option value="${id}">${id} ${t.display}</option>`).join('')}</select></label><label>裝備等級<input id="forge-level" type="number" min="1" max="${player.level}" value="${player.level}" step="1"></label><label>批次數量<select id="forge-qty"><option value="1">1 件</option><option value="5">5 件</option><option value="10">10 件</option></select></label><div class="forge-total" id="forge-total"></div>`;
 parent.append(form);const options=()=>({slot:document.getElementById('forge-slot').value,tier:document.getElementById('forge-tier').value,level:document.getElementById('forge-level').value,qty:document.getElementById('forge-qty').value});
 const refresh=()=>{const o=options(),level=Math.max(1,Math.min(player.level,nint(o.level,1,10000))),c=forgeCost(level,o.tier,Number(o.qty));document.getElementById('forge-total').textContent=`合計 ${fmt(c.gold)} 金幣 / ${c.dust} 粉塵 / ${c.crystal} 結晶 / ${c.ore} 礦石`;};for(const id of ['forge-slot','forge-tier','forge-level','forge-qty'])document.getElementById(id).onchange=refresh;refresh();
 parent.append(button('確認鍛造',()=>craftGear(options()),false,'primary'));const h=document.createElement('h3');h.textContent='重鑄工位 · 未鎖定的背包裝備';parent.append(h);
 const items=player.inventory.filter(i=>!i.locked).slice(0,12),grid=document.createElement('div');grid.className='system-grid';for(const i of items){const c=card(`<span class="bear-tag">評分 ${fmt(scoreItem(i))}</span><h3>${esc(itemTitle(i))}</h3><p>${esc(itemInfo(i))}</p><div class="bear-muted">${esc(statsText(i))}<br>重鑄 ${fmt(100+i.minLevel*15)} 金幣 / 8 粉塵 / 2 礦石</div>`);c.append(button('重鑄裝備',()=>recastGear(i.id),!afford({gold:100+i.minLevel*15,dust:8,ore:2})));grid.append(c);}parent.append(grid);if(!items.length)parent.append(card('<p>背包尚無可重鑄裝備，先鍛造或冒險取得戰利品。</p>'));
}
function renderRecruit(parent){parent.append(panelIntro('海島守護夥伴',`共 ${COMPANIONS.length} 種夥伴，其中 ${PENGHU_SOURCE.deities.length} 種神祇夥伴。出戰 ${ext().party.length} / 3 人，培養上限 Lv.${MAX_COMPANION_LEVEL}。神祇能力與角色定位為遊戲創作。`));
 addFilters(parent,true,'搜尋夥伴、神祇或廟宇名稱');const q=viewQuery.toLowerCase().trim(),rows=COMPANIONS.filter(c=>(!viewRegion||c.source?.temples.some(t=>t.region===viewRegion))&&(!q||[c.name,c.role,...(c.source?.temples||[]).map(t=>t.name+' '+t.village)].join(' ').toLowerCase().includes(q))),start=addPagination(parent,rows.length),grid=document.createElement('div');grid.className='system-grid';
 for(const c of rows.slice(start,start+12)){const r=ext().companions[c.id]||0,deployed=ext().party.includes(c.id);const el=card(`<div class="companion-top"><div class="companion-icon">${c.icon}</div><span class="bear-tag">${c.role}${deployed?' · 出戰中':''}</span></div><h3>${esc(c.name)} <small>${r?`Lv.${r}`:'尚未加入'}</small></h3><p>${esc(c.desc)}</p>`);
  if(c.source){const detail=document.createElement('details'),summary=document.createElement('summary');summary.textContent=`相關廟宇 · ${c.source.temples.length} 處`;detail.append(summary);for(const t of c.source.temples){const p=document.createElement('p');p.textContent=`${t.region} ${t.village}｜${t.name}`;detail.append(p);}el.append(detail);}
  if(!r)el.append(button(`招募 · ${fmt(c.cost)} 金幣`,()=>recruit(c.id),ext().gold<c.cost,'primary'));
  else{el.append(button(deployed?'安排休息':'加入出戰',()=>toggleParty(c.id),false,'primary'));const gold=Math.ceil(c.cost*r*.65);el.append(button(r>=MAX_COMPANION_LEVEL?'已達滿級':`培養 · ${fmt(gold)} 金 / ${r*3} 粉`,()=>upgradeCompanion(c.id),r>=MAX_COMPANION_LEVEL||!afford({gold,dust:r*3})));}grid.append(el);
 }parent.append(grid);if(!rows.length)parent.append(card('<p>沒有符合條件的夥伴。</p>'));
}
function renderSkills21(parent){parent.append(panelIntro('技能研習 · 自訂你的戰鬥節奏',`${Object.keys(EXT_SKILLS).length} 種主動技能，最高 Lv.${MAX_SKILL_LEVEL}；${Object.keys(PASSIVES).length} 種被動，最高 Lv.${MAX_PASSIVE_LEVEL}。最多啟用 6 種自動技能，主動技能每級效果 +8%。技能點 ${fmt(ext().skillPoints)}。`));
 addFilters(parent,false,'搜尋技能、元素或類型（物理／法術／治療／輔助／被動）');const q=viewQuery.trim().toLowerCase(),entries=Object.entries(EXT_SKILLS).filter(([id,m])=>[SKILLS[id].name,m.element,m.desc,SKILLS[id].type==='Physical'?'物理':SKILLS[id].type==='Magic'?'法術':SKILLS[id].type==='Heal'?'治療':'輔助'].join(' ').toLowerCase().includes(q));
 const grid=document.createElement('div');grid.className='system-grid';
 for(const [id,m]of entries){const s=SKILLS[id],r=ext().skillRanks[id]||0,c=learnCost(id),el=card(`<span class="bear-tag">${s.type==='Physical'?'物理':s.type==='Magic'?'法術':s.type==='Heal'?'治療':'輔助'} · ${s.target==='Area'?'全體':s.target==='Self'?'自身':'單體'}${m.element?' · '+m.element:''}</span><h3>${s.name} <small>Lv.${r} / ${MAX_SKILL_LEVEL}</small></h3><p>${m.desc}</p><div class="bear-muted">角色 Lv.${m.level} · MP ${s.cost} · CD ${s.cooldown} 回合<br>倍率 ×${effectiveSkill(id).multiplier.toFixed(2)}<br>${r>=MAX_SKILL_LEVEL?'已達滿級':`研習 ${fmt(c.gold)} 金幣 / ${c.skillPoints} 技能點`}</div>`);
  el.append(button(r>=MAX_SKILL_LEVEL?'已達滿級':r?'升級技能':'學習技能',()=>trainSkill(id),r>=MAX_SKILL_LEVEL||player.level<m.level||!afford(c),'primary'));
  if(r){const auto=document.createElement('label');auto.className='auto-label';const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!player.autoSkills[id];cb.onchange=()=>partySetAuto(id,cb.checked);auto.append(cb,' 自動施放');el.append(auto,button('手動施放',()=>manualSkill(id),ext().paused||player.isDefeated||player.currentMP<s.cost||(skillCooldowns[id]||0)>0));}grid.append(el);
 }
 for(const [id,p]of Object.entries(PASSIVES)){if(q&&!`${p.name} ${p.desc} 被動`.toLowerCase().includes(q))continue;const r=ext().passives[id],c={gold:(r+1)*200,skillPoints:Math.max(1,Math.ceil((r+1)/8))},el=card(`<span class="bear-tag">永久被動</span><h3>${p.name} <small>Lv.${r} / ${MAX_PASSIVE_LEVEL}</small></h3><p>${p.desc}</p><div class="bear-muted">${r>=MAX_PASSIVE_LEVEL?'已達滿級':`${fmt(c.gold)} 金幣 / ${c.skillPoints} 技能點`}</div>`,'passive');el.append(button('研習被動',()=>trainPassive(id),r>=MAX_PASSIVE_LEVEL||!afford(c),'primary'));grid.append(el);}parent.append(grid);
}
function renderGuild(parent){
 parent.append(panelIntro('熊寶商會 · 把補給裝進行囊',`商會 Lv.${guildRank()} · 聲望 ${fmt(ext().guildXP)} · 折扣 ${(guildRank()-1)*2}%。${PENGHU_SOURCE.foods.length} 間餐食商店等你造訪。價格、庫存與餐食效果皆為遊戲數值。`));
 const tabs=document.createElement('div');tabs.className='local-tabs';for(const [id,name]of [['food','餐食商店'],['bag','餐食背包'],['gear','裝備與物資'],['missions','商會委託']])tabs.append(button(name,()=>{guildTab=id;viewPage=1;viewQuery='';viewRegion='';renderSystem();},false,guildTab===id?'primary':''));parent.append(tabs);
 if(guildTab==='food'||guildTab==='bag'){
  addFilters(parent,true,'搜尋店名、餐食、類別或鄉市');let rows=filteredRows(PENGHU_SOURCE.foods,f=>[f.name,f.region,f.category,f.menu].join(' '));if(guildTab==='bag')rows=rows.filter(f=>ext().foodBag[f.id]>0);
  const start=addPagination(parent,rows.length),grid=document.createElement('div');grid.className='system-grid';
  for(const f of rows.slice(start,start+12)){const info=foodInfo(f),stock=foodStock(f),count=ext().foodBag[f.id]||0,el=card(`<span class="bear-tag">${esc(f.region)} · ${esc(f.category)}</span><h3>${esc(f.name)}</h3><p>${esc(f.menu||f.service||'冒險餐食')}</p><div class="bear-muted">${esc(f.address)}<br>HP +${Math.round(info.hp*100)}% / MP +${Math.round(info.mp*100)}%<br>${info.power?'雙攻 +8%':'擊殺金幣 +10%'}，持續 60 戰鬥回合<br>背包 ${count} 份 · 本日遊戲庫存 ${stock.left} / 5</div>`);
   if(guildTab==='food')el.append(button(`購買 · ${fmt(info.price)} 金幣`,()=>buyFood(f.id),stock.left<1||count>=99||ext().gold<info.price,'primary'));
   el.append(button('享用餐食',()=>useFood(f.id),!count||player.isDefeated));const details=document.createElement('details');details.innerHTML=`<summary>店家資訊</summary><p>${esc(f.hours||'營業時間尚未填寫')}<br>${esc(f.phone||'')}</p>`;const url=safeURL(f.url);if(url){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='查看地點 ↗';details.append(a);}el.append(details);grid.append(el);
  }parent.append(grid);if(!rows.length)parent.append(card(`<p>${guildTab==='bag'?'餐食背包尚無物品，前往餐食商店選購吧。':'沒有符合條件的商店。'}</p>`));
 }else if(guildTab==='gear'){
  refreshShop();const controls=document.createElement('div');controls.className='supply-strip';controls.append(button('更新商品 · 100 金',()=>refreshShop(true),ext().gold<100));
  for(const [kind,label,price]of [['dust','10 粉塵',160],['crystal','1 結晶',350],['sp','2 技能點',500]])controls.append(button(`${label} · ${fmt(shopPrice(price))} 金`,()=>buySupply(kind),ext().gold<shopPrice(price)));
  controls.append(button(`5 礦石 · ${fmt(shopPrice(250))} 金`,()=>{if(spend({gold:shopPrice(250)})){ext().ore+=5;ext().guildXP+=5;changed('已購買 5 個鍛造礦石。');}},ext().gold<shopPrice(250)));parent.append(controls);
  const note=document.createElement('p');note.className='bear-muted';note.textContent='裝備每 5 分鐘免費更新。提前更新需 100 金幣，每期每件限購一次。';parent.append(note);
  const grid=document.createElement('div');grid.className='system-grid';ext().offers.forEach((o,idx)=>{const el=card(`<span class="bear-tag">${EQUIPMENT_SLOTS[o.item.slot]} · 評分 ${fmt(scoreItem(o.item))}</span><h3>${esc(o.item.name)}</h3><p>${esc(itemInfo(o.item))}</p><div class="bear-muted">${esc(statsText(o.item))}</div>`);el.append(button(o.sold?'已售出':`購買 · ${fmt(shopPrice(o.price))} 金`,()=>buyOffer(idx,o.item.id),o.sold||ext().gold<shopPrice(o.price),'primary'));grid.append(el);});parent.append(grid);
 }else{
  parent.append(button('捐獻 200 金幣 · 聲望 +40',donateGuild,ext().gold<200||guildRank()>=10));
  for(const m of MISSIONS){const d=missionData(m),el=card(`<h3>${m.name}</h3><p>累積 ${fmt(Math.min(d.current,d.target))} / ${fmt(d.target)}</p><div class="bear-muted">獎勵 ${fmt(d.gold)} 金幣 / 60 聲望 / 1 技能點</div>`);el.append(button('領取獎勵',()=>claimMission(m.id),d.current<d.target,'primary'));parent.append(el);}
 }
}
function renderHelp(parent){parent.append(panelIntro('熊寶冒險手冊','先穿上裝備、招募夥伴，再選一處想出發的景點。'));
 const html=`<h3>裝備評分與自動配裝</h3><p>評分只計算裝備實際屬性，包含強化後的數值。可切換均衡、物理、法術與坦克取向；各項屬性有不同權重。位階不會額外加分。同部位分數更高、熊寶等級足夠時才替換。鎖定裝備會受保護；目前穿戴裝備若鎖定，該部位不會自動更動。自動比較在每次掉落後執行。</p><h3>鍛造與成長</h3><p>鍛造可指定部位、T0～T5 位階、裝備等級，並批次製作 1／5／10 件。所有費用與空間會先檢查，必定成功。重鑄會改變基礎屬性，結果可能降低；等級、位階與強化保留。裝備強化上限 +20，升階上限 T5，裝備等級不可超過熊寶。</p><h3>場景與冒險</h3><p>在冒險頁選擇景點與任務。踏查需要 20 個有效戰鬥回合與 3 次擊殺；守護需要 35 回合與 8 次擊殺；幻境首領需要 50 回合、12 次擊殺並擊敗首領。暫停與戰敗冷卻不累計回合。每次冒險只能領取一次獎勵，首次完成該景點可收集印章。任務中不可換場，必須先完成領獎或放棄。景點的戰鬥情節皆為幻想遊戲。</p><h3>夥伴、技能與餐食</h3><p>最多 3 位夥伴出戰，最高 Lv.50。夥伴的能力依遊戲角色定位設計，神祇相關能力不代表宗教或民俗意涵。主動技能最高 Lv.50、被動最高 Lv.30；最多啟用 6 種自動技能。治療優先於攻擊，MP 不足時改普攻。手動技能每回合最多一次；護盾與餐食效果不會無限疊加。餐食可恢復生命與魔力，並提供 60 戰鬥回合加成。同類效果取代前一次。</p><h3>保存與舊版進度</h3><p>可在設定匯出或匯入 JSON。支援 v19／v20 進度轉入，自動存檔開啟時，每次操作後保存、戰鬥每 60 秒保存。跨版本共用原本的冒險進度；為避免檔案移動或瀏覽資料清除導致進度遺失，請定期匯出備份。本遊戲為單機版，所有價格與獎勵均為遊戲設定。</p><h3>評分權重</h3>`;
 const help=document.createElement('div');help.className='help-copy';help.innerHTML=html;for(const p of Object.values(PROFILES)){const para=document.createElement('p');para.textContent=`${p.name}：`+Object.entries(p.weights).map(([k,v])=>`${k} ×${v}`).join('、');help.append(para);}parent.append(help);
}
renderSystem=function(){if(!player.extension?.v21Gift||pageView==='battle')return;const content=document.getElementById('system-content');if(!content)return;content.replaceChildren();
 if(pageView==='adventure')renderAdventure(content);else if(pageView==='forge')renderForge(content);else if(pageView==='recruit')renderRecruit(content);else if(pageView==='guild')renderGuild(content);else if(pageView==='skills')renderSkills21(content);else renderHelp(content);
 document.getElementById('system-resources').textContent=`金幣 ${fmt(ext().gold)}　粉塵 ${fmt(ext().dust)}　結晶 ${fmt(ext().crystal)}　礦石 ${fmt(ext().ore)}　技能點 ${fmt(ext().skillPoints)}`;
};
updateLiveSystem=function(){/* Catalogs update on actions; combat never replaces focused controls or search text. */};
// Read-only ticking fields stay current without rebuilding catalogs.
function updateVisibleCounters(){if(pageView==='battle')return;document.getElementById('system-resources').textContent=`金幣 ${fmt(ext().gold)}　粉塵 ${fmt(ext().dust)}　結晶 ${fmt(ext().crystal)}　礦石 ${fmt(ext().ore)}　技能點 ${fmt(ext().skillPoints)}`;}
const updatePlayerUI21=updatePlayerUI;
updatePlayerUI=function(){updatePlayerUI21();if(!tickBatch&&player.extension?.v21Gift)updateVisibleCounters();};
const makeSave20=makeSave;
makeSave=function(){const data=makeSave20();data.schemaVersion=21;data.savedAtTick=sessionTick;data.skillCooldowns={...skillCooldowns};return data;};
let saveWarning=false;
saveGame=function(quiet=false){try{const data=makeSave();localStorage.setItem(V21_KEY,JSON.stringify(data));lastSaveTime=data.lastSaveTime;document.getElementById('last-save-time').textContent=new Date(lastSaveTime).toLocaleString('zh-TW');saveWarning=false;if(quiet!==true)notify('冒險進度已保存。');return true;}catch(e){if(!saveWarning||quiet!==true)notify('無法自動保存，請使用「匯出存檔」備份。');saveWarning=true;return false;}};
const validateSave20=validateSave;
validateSave=function(data){validateSave20(data);if(data.schemaVersion&&data.schemaVersion>21)throw Error('future-version');if(data.player.inventory.length>500000)throw Error('oversized');for(const key of ['currentHP','currentMP'])if(data.player[key]!==undefined&&!Number.isFinite(data.player[key]))throw Error('invalid-number');return data;};
const applySave20=applySave;
applySave=function(data){validateSave(data);applySave20(data);for(const id of Object.keys(SKILLS))skillCooldowns[id]=nint(data.skillCooldowns?.[id],0,SKILLS[id].cooldown||0);sessionTick=nint(data.savedAtTick);lastManualTick=-1;renderSkills();};
loadGame=function(){let found=false;for(const key of [V21_KEY,EXT_KEY,STORAGE_KEY]){try{const raw=localStorage.getItem(key);if(!raw)continue;found=true;applySave(JSON.parse(raw));logCombat('📂 已讀取熊寶冒險進度。','log-status');return true;}catch(e){continue;}}if(found)notify('無法讀取保存的進度；可在設定匯入 JSON 備份。');return false;};
deleteSave=function(){if(!confirm('確定重置目前的冒險？請先匯出想保留的進度。'))return;player=initializePlayerObject();currentZoneIndex=0;autoSaveEnabled=true;sessionTick=0;lastManualTick=-1;initializeGame();saveGame(true);changed('已開始新的熊寶冒險。');};
const initializeGame20=initializeGame;
initializeGame=function(){lastManualTick=-1;initializeGame20();if(ext().autoOptimize)optimizeGear(true);renderZoneUI();updatePlayerUI();};
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('[data-system]').forEach(b=>b.onclick=()=>setView(b.dataset.system));
 document.getElementById('gear-profile').onchange=e=>{ext().profile=e.target.value;changed('配裝評分取向已更新。');};
 document.getElementById('gear-auto').onchange=e=>{ext().autoOptimize=e.target.checked;if(ext().autoOptimize)optimizeGear(true);changed(ext().autoOptimize?'掉落後自動配裝已啟用。':'掉落後自動配裝已停用。');};
 document.getElementById('gear-optimize').onclick=()=>optimizeGear();
 document.getElementById('open-stats').addEventListener('click',()=>{renderEquipmentSlots();renderEquipmentBonusSummary();renderInventory();});
 // Correct the original handlers: all controls are keyboard accessible and modal states are independent.
 document.querySelectorAll('.close-btn').forEach(b=>{b.tabIndex=0;b.setAttribute('role','button');b.setAttribute('aria-label','關閉');b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();b.click();}};});
 document.getElementById('auto-save-checkbox').onchange=()=>{if(autoSaveEnabled)saveGame(true);};
 openSystem('battle');renderZoneUI();updatePlayerUI();
});

