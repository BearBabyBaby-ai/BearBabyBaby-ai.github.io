
// v22: presentation revision, deity talent trees, commission catalog and canonical stat labels.
// Combat scheduling, damage calculation, cooldowns, enemy generation and auto-cast rules are inherited unchanged.
const V22_KEY='BearChronicleV22';
const COMBAT_CORE22={gameLoop,monsterAttack,useSkill,performAutoSkills,calculateDamage,regenLoop,spawnMonster,createMonster,companionsAct};
const LEGACY_COMPANIONS22=COMPANIONS.filter(c=>!c.source).map(c=>({...c}));
COMPANIONS.splice(0,COMPANIONS.length,...COMPANIONS.filter(c=>c.source&&PENGHU_SOURCE.deities.some(d=>d.id===c.id)));
const STAT_LABELS22={STR:'力量',INT:'智力',CON:'體質',AGI:'敏捷',LUK:'幸運',SPL:'特殊幸運',PATK:'物理攻擊',MATK:'法術攻擊',PDEF:'物理防禦',MDEF:'法術防禦',MaxHP:'最大生命',MaxMP:'最大魔力',Pcrit:'物理爆擊率',Mcrit:'法術爆擊率'};
const STAT_ALIASES22={ATK:'PATK',P_ATK:'PATK',PHYSICALATK:'PATK',PHYSICALATTACK:'PATK',MPATK:'MATK',M_ATK:'MATK',MAGICATK:'MATK',MAGICATTACK:'MATK',DEF:'PDEF',P_DEF:'PDEF',M_DEF:'MDEF',MDF:'MDEF',HP:'MaxHP',MAXHP:'MaxHP',HP_MAX:'MaxHP',MP:'MaxMP',MAXMP:'MaxMP',MP_MAX:'MaxMP',PCRIT:'Pcrit',PCRITRATE:'Pcrit',MCRIT:'Mcrit',MCRITRATE:'Mcrit'};
for(const key of STAT_KEYS)STAT_ALIASES22[key.toUpperCase()]=key;
function canonicalStats22(stats){const out={};if(!stats||typeof stats!=='object')return out;for(const [key,value]of Object.entries(stats)){const canonical=STAT_ALIASES22[key.toUpperCase().replace(/\s/g,'')];if(canonical)out[canonical]=Math.max(out[canonical]||0,nint(value));}return out;}
const normalizeItem21=normalizeItem;
normalizeItem=function(i){if(i){i.stats=canonicalStats22(i.stats);if(i.baseStats&&typeof i.baseStats==='object')i.baseStats=canonicalStats22(i.baseStats);}normalizeItem21(i);};
statsText=function(i){return Object.entries(getItemStats(i)).filter(([,v])=>v).map(([k,v])=>`${STAT_LABELS22[k]} +${fmt(v)}${/crit/i.test(k)?'%':''}`).join('　');};
// Existing effect types only: catalog growth does not introduce a new battle resolution rule.
const ELEMENTS22=[['金','鎏金'],['木','蒼翠'],['水','滄浪'],['火','赤焰'],['土','磐岩'],['風','嵐風'],['雷','霆光'],['冰','霜華'],['光明','曦耀'],['暗黑','幽夜'],['心靈','念波'],['時空','星隙'],['靈魂','魂火']];
for(let e=0;e<ELEMENTS22.length;e++)for(let stage=0;stage<6;stage++){
 const [element,prefix]=ELEMENTS22[e],suffix=['飛矢','穿心槍','輪舞','迴響','天幕','終焉'][stage],id=`art_${e}_${stage}`,area=stage>=2&&stage!==3;
 SKILLS[id]={name:prefix+suffix,cost:12+stage*8+(e%3)*2,type:'Magic',target:area?'Area':'Single',multiplier:1.55+stage*.67+(e%3)*.08,isAuto:true,cooldown:2+stage*2,effect:stage===3?'drain':undefined};
 EXT_SKILLS[id]={level:2+stage*7+(e%4),element,desc:`${element}系${area?'全體':'單體'}法術${stage===3?'，吸收實際傷害的 15% 恢復生命':''}。`};
}
const PHYSICAL_NAMES22=['破風斬','踏浪擊','碎岩重擊','流星刺','疾影連斬','裂空旋舞','斷潮斬','破陣突擊','落日重劍','月牙回旋','蒼龍突刺','玄武震擊','奔雷連擊','金剛重拳','逐浪飛刃','旋月雙斬','獅心斬','天穹碎擊','影牙虹吸','鋼鐵風暴','星河重斬','萬鈞破軍'];
PHYSICAL_NAMES22.forEach((name,i)=>{const id=`weapon_art_${i}`,area=i%3===2;SKILLS[id]={name,cost:9+i*2,type:'Physical',target:area?'Area':'Single',multiplier:1.2+i*.19,isAuto:true,cooldown:2+i%8,effect:i===18?'drain':undefined};EXT_SKILLS[id]={level:1+i*2,element:['金','風','土','水'][i%4],desc:area?'物理技，攻擊全體敵人。':i===18?'物理技，吸收實際傷害的 15% 恢復生命。':'物理技，集中攻擊單一敵人。'};});
['晨露','海風','月華','星雨','春芽','曙光'].forEach((name,i)=>{const id=`renewal_${i}`;SKILLS[id]={name:name+'療癒',cost:14+i*7,type:'Heal',target:'Self',multiplier:1.7+i*.9,isAuto:true,cooldown:4+i,isAuto:true};EXT_SKILLS[id]={level:3+i*6,element:'光明',desc:'生命低於 55% 時，依既有治療規則恢復生命。'};});
['星泉','靜念','玄岩','海盾','破曉','勇氣'].forEach((name,i)=>{const id=`support_art_${i}`,effect=i<2?'mana':i<4?'shield':'buff';SKILLS[id]={name:name+({mana:'回流',shield:'結界',buff:'祝禱'}[effect]),cost:effect==='mana'?0:16+i*4,type:'Support',target:'Self',multiplier:effect==='mana'?.15+i*.04:effect==='shield'?2.8+i*.4:.1+i*.02,isAuto:true,cooldown:12+i*2,effect};EXT_SKILLS[id]={level:4+i*7,element:['水','心靈','土','水','光明','心靈'][i],desc:effect==='mana'?'依既有規則恢復最大魔力的一定比例。':effect==='shield'?'依既有護盾規則保護自身，持續 10 回合。':'依既有祝禱規則提升雙攻，持續 10 回合。'};});
const NEW_PASSIVES22={
 force:{name:'武裝精修',stat:'PATK',rate:.015},arcana:{name:'術式精修',stat:'MATK',rate:.015},iron:{name:'鋼鐵意志',stat:'PDEF',rate:.015},veil:{name:'秘法屏障',stat:'MDEF',rate:.015},
 lifebloom:{name:'生命綻放',stat:'maxHP',rate:.015},manabloom:{name:'魔力綻放',stat:'maxMP',rate:.015},hpflow:{name:'溫暖脈動',stat:'HPRegen',rate:.025},mpflow:{name:'寧靜呼吸',stat:'MPRegen',rate:.025},
 pprecision:{name:'戰技洞察',stat:'PCrit',flat:.25},mprecision:{name:'術法洞察',stat:'MCrit',flat:.25},lucky:{name:'吉運隨行',stat:'LUK',flat:1},special:{name:'星運眷顧',stat:'SPL',flat:1},
 masterforge:{name:'精工節用',economic:'forge',rate:.005},pilgrim:{name:'遠行獎勵',economic:'adventure',rate:.01}
};
const DERIVED_LABELS22={...STAT_LABELS22,maxHP:'最大生命',maxMP:'最大魔力',HPRegen:'生命恢復',MPRegen:'魔力恢復',PCrit:'物理爆擊率',MCrit:'法術爆擊率'};
for(const [id,p]of Object.entries(NEW_PASSIVES22))PASSIVES[id]={name:p.name,desc:p.economic==='forge'?'每級鍛造金幣費用降低 0.5%。':p.economic==='adventure'?'每級冒險結算金幣增加 1%。':`每級${DERIVED_LABELS22[p.stat]} ${p.flat?'+'+p.flat+(p.stat.includes('Crit')?' 個百分點':''):'+'+(p.rate*100)+'%'}。`};
const TALENT_BRANCHES22=[{id:'might',name:'威能',icon:'✦',text:'攻擊與專注'},{id:'ward',name:'庇護',icon:'◇',text:'防禦與續航'},{id:'journey',name:'行旅',icon:'◎',text:'成長與後勤'}];
function deityTalents22(id){const c=COMPANIONS.find(x=>x.id===id);if(!c)return [];const magic=['mage','healer'].includes(c.kind),seed=hash(c.id),theme=c.name.replace(/大帝|王爺|菩薩|佛祖|千歲|帝君|聖母|正神/g,'').slice(0,4)||c.name.slice(0,2);
 const effects=[[magic?'MATK':'PATK',magic?'MCrit':'PCrit',magic?'maxMP':'maxHP',magic?'MATK':'PATK'],['PDEF','MDEF','maxHP','HPRegen'],['MPRegen','forge','adventure','maxMP']];
 const names=[['啟明','凝神','靈蘊','共鳴'],['固守','安寧','長青','回春'],['息念','匠心','遠行','星泉']];
 return TALENT_BRANCHES22.flatMap((b,bi)=>names[bi].map((name,depth)=>{const stat=effects[bi][depth],flat=/Crit/.test(stat),rate=flat?.3:stat==='forge'?.004:stat==='adventure'?.01:.008+(seed%4)*.002;
  return {id:`${b.id}_${depth}`,branch:b.id,depth,name:`${theme}・${name}`,stat,rate,max:5,required:depth?[5,10,20,35][depth]:1,desc:`每級${stat==='forge'?'鍛造金幣費用降低':stat==='adventure'?'冒險金幣增加':DERIVED_LABELS22[stat]+'增加'} ${flat?rate+' 個百分點':Math.round(rate*10000)/100+'%'}。`};}));
}
function talentState22(id){return ext().deityTalents[id]||{};}
function talentSpent22(id){return Object.values(talentState22(id)).reduce((s,n)=>s+n,0);}
function talentAvailable22(id){return ext().companions[id]?Math.max(0,3+ext().companions[id]-1-talentSpent22(id)):0;}
function talentEffect22(stat){let value=0;for(const id of ext().party)for(const node of deityTalents22(id))if(node.stat===stat)value+=(talentState22(id)[node.id]||0)*node.rate;return value;}
function learnTalent22(id,nodeId){const node=deityTalents22(id).find(n=>n.id===nodeId),level=ext().companions[id];if(!node||!level)return false;const state=talentState22(id),rank=state[nodeId]||0;
 if(rank>=node.max||talentAvailable22(id)<1||level<node.required||(node.depth&&!(state[`${node.branch}_${node.depth-1}`]>=3))){notify('天賦點、夥伴等級或前置天賦尚未符合。');return false;}
 const cost=Math.ceil((80+COMPANIONS.find(c=>c.id===id).cost*.2)*(node.depth+1)*(rank+1));if(!spend({gold:cost}))return false;
 ext().deityTalents[id]||={};ext().deityTalents[id][nodeId]=rank+1;changed(`${node.name} 提升至 Lv.${rank+1}。`);renderTalent22(id);return true;
}
function resetTalents22(id){if(!ext().companions[id]||!talentSpent22(id))return;if(!confirm('重置這位夥伴的天賦？天賦點全數返還，已花費金幣不退還。'))return;ext().deityTalents[id]={};changed('天賦點已返還。');renderTalent22(id);}
const migratePlayer21=migratePlayer;
migratePlayer=function(){const previous=player.extension,oldCompanions=previous?.companions?{...previous.companions}:{},needsRefund=!previous?.deityOnlyMigration;
 migratePlayer21();const e=ext();e.version=22;e.deityOnlyMigration=true;e.deityTalents=e.deityTalents&&typeof e.deityTalents==='object'?e.deityTalents:{};e.progress22=e.progress22&&typeof e.progress22==='object'?e.progress22:{};
 if(needsRefund){let gold=0,dust=0;for(const c of LEGACY_COMPANIONS22){const rank=nint(oldCompanions[c.id],0,50);if(!rank)continue;gold+=c.cost;for(let r=1;r<rank;r++){gold+=Math.ceil(c.cost*r*.65);dust+=r*3;}}e.gold+=gold;e.dust+=dust;if(gold)logCombat(`夥伴調整補償：返還 ${fmt(gold)} 金幣與 ${fmt(dust)} 粉塵。`,'log-status');}
 const allowed=new Set(COMPANIONS.map(c=>c.id));for(const id of Object.keys(e.companions))if(!allowed.has(id))delete e.companions[id];e.party=e.party.filter(id=>allowed.has(id));
 for(const id of Object.keys(e.deityTalents)){if(!allowed.has(id)||!e.companions[id]){delete e.deityTalents[id];continue;}const original=e.deityTalents[id],valid={};let available=3+e.companions[id]-1;for(const n of deityTalents22(id)){let rank=nint(original?.[n.id],0,5);if(e.companions[id]<n.required||(n.depth&&!(valid[`${n.branch}_${n.depth-1}`]>=3)))rank=0;rank=Math.min(rank,available);if(rank)valid[n.id]=rank;available-=rank;}e.deityTalents[id]=valid;}
 for(const k of ['crafted','foodBought','bossKills'])e.progress22[k]=nint(e.progress22[k]);
};
const calculateStats21=calculateStats;
calculateStats=function(){calculateStats21();if(!player.extension?.deityOnlyMigration)return;
 for(const [id,p]of Object.entries(NEW_PASSIVES22)){const rank=ext().passives[id]||0;if(!rank||!p.stat)continue;player[p.stat]=p.flat?player[p.stat]+rank*p.flat:player[p.stat]*(1+rank*p.rate);}
 for(const stat of ['PATK','MATK','PDEF','MDEF','maxHP','maxMP','HPRegen','MPRegen'])player[stat]*=1+talentEffect22(stat);
 player.PCrit=Math.min(95,player.PCrit+talentEffect22('PCrit'));player.MCrit=Math.min(95,player.MCrit+talentEffect22('MCrit'));
 for(const k of ['PATK','MATK','PDEF','MDEF','maxHP','maxMP'])player[k]=Math.floor(player[k]);
 player.PDR=Math.min(90,Math.floor(player.PDEF*.5));player.MDR=Math.min(90,Math.floor(player.MDEF*.5));player.currentHP=Math.min(player.currentHP,player.maxHP);player.currentMP=Math.min(player.currentMP,player.maxMP);
};
const forgeCost21=forgeCost,adventureReward21=adventureReward;
forgeCost=function(level,tier,qty=1){const c=forgeCost21(level,tier,qty),discount=Math.min(.5,talentEffect22('forge')+(ext().passives.masterforge||0)*.005);if(discount)c.gold=Math.ceil(c.gold*(1-discount));return c;};
adventureReward=function(r){const result=adventureReward21(r),bonus=talentEffect22('adventure')+(ext().passives.pilgrim||0)*.01;if(bonus)result.gold=Math.floor(result.gold*(1+bonus));return result;};
function recordProgress22(key,n){ext().progress22[key]=nint(ext().progress22[key])+n;if(autoSaveEnabled)saveGame(true);}
const craftGear21=craftGear,buyFood21=buyFood,handleMonsterDefeat21=handleMonsterDefeat;
craftGear=function(options){const ok=craftGear21(options);if(ok)recordProgress22('crafted',Number(options.qty));return ok;};
buyFood=function(id){const ok=buyFood21(id);if(ok)recordProgress22('foodBought',1);return ok;};
handleMonsterDefeat=function(m){const first=!m.rewarded&&/^\[(BOSS|幻境首領)\]/.test(m.name),result=handleMonsterDefeat21(m);if(first)recordProgress22('bossKills',1);return result;};
const COMMISSION_CATEGORIES22={combat:'戰鬥',trade:'商旅',forge:'工匠',adventure:'探索',growth:'養成'};
const COMMISSION_FAMILIES22=[
 ['kills','combat',['巡邏清剿','勇者試煉','戰場功績','百戰遠征'],[20,80,200,500]],
 ['sold','trade',['裝備出清','巡迴販售','商旅訂單','交易達人'],[5,20,60,150]],
 ['dismantled','forge',['資源回收','拆解研習','循環工坊','回收專家'],[5,20,60,150]],
 ['crafted','forge',['初試鍛造','工匠委託','精工訂單','鍛造名匠'],[3,10,30,100]],
 ['foodBought','trade',['旅途補給','美食採購','餐食訂單','海島食旅'],[3,10,25,60]],
 ['adventureCount','adventure',['踏上旅程','探索小隊','海島尋蹤','冒險名家'],[1,3,8,20]],
 ['stamps','adventure',['第一枚印章','沿途風景','海島足跡','集章遠征'],[1,5,12,30]],
 ['skills','growth',['技能入門','研習心得','熟練技藝','技能宗師'],[3,10,30,100]],
 ['companions','growth',['結伴同行','守護小隊','夥伴集會','海島盟約'],[1,3,8,15]],
 ['cultivation','growth',['夥伴成長','悉心培養','修行旅途','守護共修'],[3,10,30,80]],
 ['talents','growth',['天賦啟蒙','靈能開展','分支精修','天賦大成'],[1,5,15,40]],
 ['bossKills','combat',['首領討伐','首領追獵','精銳出征','幻境征服'],[1,3,10,25]]
];
const COMMISSIONS22=COMMISSION_FAMILIES22.flatMap(([metric,category,names,steps])=>names.map((name,tier)=>({id:tier===0&&metric==='kills'?'hunt':tier===0&&metric==='sold'?'trade':tier===0&&metric==='dismantled'?'recycle':`${metric}_${tier}`,name,metric,category,tier,step:steps[tier]})));
MISSIONS.splice(0,MISSIONS.length,...COMMISSIONS22);
function missionMetric22(key){const e=ext();if(key==='stamps')return e.stamps.length;if(key==='skills')return Math.max(0,Object.values(e.skillRanks).reduce((a,b)=>a+b,0)-4)+Object.values(e.passives).reduce((a,b)=>a+b,0);if(key==='companions')return Object.keys(e.companions).length;if(key==='cultivation')return Object.values(e.companions).reduce((a,b)=>a+Math.max(0,b-1),0);if(key==='talents')return Object.keys(e.companions).reduce((a,id)=>a+talentSpent22(id),0);return ['kills','sold','dismantled','adventureCount'].includes(key)?e[key]:e.progress22[key]||0;}
missionData=function(m){const done=nint(ext().missions[m.id]),round=done+1,target=m.step*round;return {done,target,current:missionMetric22(m.metric),gold:(120+m.tier*160)*round,xp:30+m.tier*20,sp:1+m.tier,dust:3+m.tier*3,ore:m.tier+1};};
claimMission=function(id){const m=COMMISSIONS22.find(x=>x.id===id);if(!m)return false;const d=missionData(m);if(d.current<d.target)return false;ext().missions[id]=d.done+1;ext().gold+=d.gold;ext().guildXP+=d.xp;ext().skillPoints+=d.sp;ext().dust+=d.dust;ext().ore+=d.ore;changed(`完成 ${m.name}：${fmt(d.gold)} 金幣、${d.xp} 聲望、${d.sp} 技能點、${d.dust} 粉塵、${d.ore} 礦石。`);return true;};
let commissionCategory22='all',skillCategory22='all',talentBranch22='might',talentId22=null,combatView22='overview';
function combatViewSwitch22(view){combatView22=view;document.getElementById('main-game').dataset.combatView=view;document.querySelectorAll('[data-combat-view]').forEach(b=>{b.classList.toggle('active',b.dataset.combatView===view);b.setAttribute('aria-selected',b.dataset.combatView===view);});}
function styleScene22(node,s){const i=PENGHU_SOURCE.scenes.findIndex(x=>x.id===s.id),hue=((i+1)*137.508)%360;node.style.setProperty('--scene-hue',hue.toFixed(2));node.dataset.sceneId=s.id;}
const ENEMY_NODES22=new Map();
updateMonsterUI=function(){if(tickBatch)return;const list=document.getElementById('monster-list'),live=monsters.filter(m=>m.currentHP>0&&!m.rewarded),ids=new Set(live.map(m=>String(m.id)));
 document.getElementById('monster-count').textContent=live.length;document.getElementById('monster-max-count').textContent=monsters.length;
 for(const [id,n]of ENEMY_NODES22)if(!ids.has(id)){n.remove();ENEMY_NODES22.delete(id);}
 for(const m of live){let n=ENEMY_NODES22.get(String(m.id));if(!n){n=document.createElement('article');n.className='enemy22'+(m.isSpecial?' elite':'');n.innerHTML=`<div class="enemy-head22"><span class="enemy-icon22">${m.isSpecial?'♛':'◆'}</span><strong class="enemy-name22"></strong><span class="enemy-level22"></span></div><progress class="enemy-hp22"></progress><div class="enemy-numbers22"></div><details><summary>查看屬性</summary><div class="enemy-stats22"></div></details>`;ENEMY_NODES22.set(String(m.id),n);list.append(n);}
 n.querySelector('.enemy-name22').textContent=m.name;n.querySelector('.enemy-level22').textContent=`Lv.${m.level}`;const hp=n.querySelector('.enemy-hp22');hp.max=m.maxHP;hp.value=Math.max(0,m.currentHP);n.querySelector('.enemy-numbers22').textContent=`HP ${fmt(Math.max(0,m.currentHP))} / ${fmt(m.maxHP)}`;
 n.querySelector('.enemy-stats22').textContent=`物理攻擊 ${fmt(m.PATK)}　法術攻擊 ${fmt(m.MATK)}　物理防禦 ${fmt(m.PDEF)}　法術防禦 ${fmt(m.MDEF)}`;
 }
};
renderZoneUI=function(){const z=ZONE_CONFIGS[currentZoneIndex];document.getElementById('current-zone-name').textContent=`戰區 ${currentZoneIndex+1}`;document.getElementById('zone-min-lvl').textContent=z.minLevel;document.getElementById('zone-max-lvl').textContent=z.maxLevel;document.getElementById('prev-zone').disabled=currentZoneIndex===0;document.getElementById('next-zone').disabled=currentZoneIndex>=ZONE_CONFIGS.length-1;};
renderEquipmentBonusSummary=function(){if(document.getElementById('statsModal').style.display!=='block')return;const node=document.getElementById('equipment-bonus-summary'),total={};for(const i of Object.values(player.equipment).filter(Boolean))for(const [key,v]of Object.entries(getItemStats(i)))total[key]=(total[key]||0)+v;
 node.innerHTML=Object.entries(STAT_LABELS22).map(([key,label])=>`<div class="bonus22"><span>${label} <small>${key}</small></span><strong>+${fmt(total[key]||0)}${/crit/i.test(key)?'%':''}</strong></div>`).join('');
};
renderSkills=function(){if(!player.extension?.deityOnlyMigration)return;const area=document.getElementById('skill-area'),enabled=ext().skillPriority.filter(id=>ext().skillRanks[id]>0&&player.autoSkills[id]);
 const stamp=enabled.map(id=>`${id}:${ext().skillRanks[id]}`).join('|');if(area.dataset.roster!==stamp){area.dataset.roster=stamp;area.replaceChildren();for(const id of enabled){const n=document.createElement('div');n.className='quick-skill22';n.dataset.skill=id;n.innerHTML=`<div class="quick-skill-head22"><strong>${esc(SKILLS[id].name)}</strong><span>Lv.${ext().skillRanks[id]}</span></div><small>MP ${SKILLS[id].cost} · 冷卻 ${SKILLS[id].cooldown} 回合</small><progress max="1" value="1"></progress><span class="skill-state22"></span>`;n.append(button('手動施放',()=>manualSkill(id),false,'primary'));area.append(n);}if(!enabled.length)area.innerHTML='<p class="bear-empty">目前未啟用自動技能。</p>';const link=button('管理自動技能',()=>setView('skills'));link.classList.add('manage-skills22');area.append(link);}
 for(const n of area.querySelectorAll('[data-skill]')){const id=n.dataset.skill,remaining=skillCooldowns[id]||0,s=SKILLS[id],disabled=ext().paused||player.isDefeated||remaining>0||player.currentMP<s.cost;n.querySelector('progress').value=s.cooldown?1-remaining/s.cooldown:1;n.querySelector('.skill-state22').textContent=remaining?`冷卻 ${remaining} 回合`:player.currentMP<s.cost?'魔力不足':'準備就緒';n.querySelector('button').disabled=disabled;}
};
const updatePlayerUIBefore22=updatePlayerUI;
updatePlayerUI=function(){updatePlayerUIBefore22();if(tickBatch||!player.extension?.deityOnlyMigration)return;styleScene22(document.getElementById('zone-panel'),currentScene());renderSkills();const shield=document.getElementById('barrier-status22');shield.textContent=ext().barrier>0?`護盾 ${fmt(ext().barrier)} · ${ext().barrierTicks} 回合`:'護盾未啟用';
 const buffs=document.getElementById('battle-buffs22');buffs.textContent=[ext().buffs.food?.ticks>0?`餐食加成 ${ext().buffs.food.ticks} 回合`:null,ext().buffs.focus?.ticks>0?`戰意加成 ${ext().buffs.focus.ticks} 回合`:null].filter(Boolean).join(' · ')||'目前無限時加成';
 updateMissionSummary22();
};
const openSystem21=openSystem;
openSystem=function(tab){if(tab!=='equipment'){document.body.dataset.page=tab;document.querySelector('header').dataset.page=tab;}openSystem21(tab);if(tab==='equipment'){document.getElementById('statsModal').dataset.page='equipment';}if(tab==='battle'){combatViewSwitch22(combatView22);renderZoneUI();updateMonsterUI();}};
function viewChips22(parent,options,current,onSelect){const row=document.createElement('div');row.className='filter-chips22';for(const [key,label]of Object.entries(options))row.append(button(label,()=>onSelect(key),false,key===current?'primary':''));parent.append(row);}
function renderMissions22(parent){const ready=COMMISSIONS22.filter(m=>{const d=missionData(m);return d.current>=d.target;}).length;
 const summary=document.createElement('div');summary.className='mission-summary22';summary.innerHTML=`<div><strong>${COMMISSIONS22.length}</strong><span>委託任務</span></div><div><strong>${ready}</strong><span>可領取</span></div><div><strong>${fmt(Object.values(ext().missions).reduce((s,v)=>s+nint(v),0))}</strong><span>完成輪次</span></div>`;parent.append(summary);
 viewChips22(parent,{all:'全部',ready:'可領取',...COMMISSION_CATEGORIES22},commissionCategory22,key=>{commissionCategory22=key;viewPage=1;renderSystem();});
 const rows=COMMISSIONS22.filter(m=>commissionCategory22==='all'||commissionCategory22==='ready'&&missionData(m).current>=missionData(m).target||m.category===commissionCategory22),start=addPagination(parent,rows.length),grid=document.createElement('div');grid.className='system-grid mission-grid22';
 for(const m of rows.slice(start,start+12)){const d=missionData(m),ready=d.current>=d.target,n=card(`<span class="bear-tag">${COMMISSION_CATEGORIES22[m.category]} · ${['初階','進階','精銳','大師'][m.tier]}</span><h3>${m.name}</h3><div class="mission-progress22"><strong>${fmt(Math.min(d.current,d.target))}<small> / ${fmt(d.target)}</small></strong><span>第 ${d.done+1} 輪</span></div><progress value="${Math.min(d.current,d.target)}" max="${d.target}"></progress><p>${fmt(d.gold)} 金幣 · ${d.xp} 聲望<br>${d.sp} 技能點 · ${d.dust} 粉塵 · ${d.ore} 礦石</p>`,'commission22');n.append(button(ready?'領取委託獎勵':'進行中',()=>claimMission(m.id),!ready,'primary'));grid.append(n);}parent.append(grid);if(!rows.length)parent.append(card('<p>這個分類目前沒有可領取的委託。</p>'));
}
function updateMissionSummary22(){const n=document.getElementById('mission-ready22');if(n)n.textContent=COMMISSIONS22.filter(m=>{const d=missionData(m);return d.current>=d.target;}).length;}
const renderGuild21=renderGuild;
renderGuild=function(parent){if(guildTab!=='missions'){renderGuild21(parent);return;}parent.append(panelIntro('商會委託大廳','戰鬥、商旅、工匠、探索、養成五大系列，完成一輪後會開啟下一輪目標。'));
 const tabs=document.createElement('div');tabs.className='local-tabs';for(const [id,name]of [['food','餐食商店'],['bag','餐食背包'],['gear','裝備與物資'],['missions','商會委託']])tabs.append(button(name,()=>{guildTab=id;viewPage=1;renderSystem();},false,id==='missions'?'primary':''));parent.append(tabs);renderMissions22(parent);
};
function renderTalent22(id){const c=COMPANIONS.find(x=>x.id===id);if(!c)return;talentId22=id;document.getElementById('talentModal22').style.display='block';const root=document.getElementById('talent-content22');root.replaceChildren();root.append(panelIntro(`${c.name}・專屬天賦`,`${c.role} · Lv.${ext().companions[id]||0} · 可用天賦點 ${talentAvailable22(id)} · 已用 ${talentSpent22(id)}。招募時取得 3 點，之後每培養 1 級取得 1 點。只有出戰中的夥伴會提供天賦加成。`));
 viewChips22(root,Object.fromEntries(TALENT_BRANCHES22.map(b=>[b.id,`${b.icon} ${b.name}`])),talentBranch22,branch=>{talentBranch22=branch;renderTalent22(id);});
 const tree=document.createElement('div');tree.className='talent-tree22';tree.dataset.branch=talentBranch22;
 for(const branch of TALENT_BRANCHES22){const col=document.createElement('section');col.className='talent-branch22';col.dataset.branch=branch.id;col.innerHTML=`<h3>${branch.icon} ${branch.name}<small>${branch.text}</small></h3>`;
  for(const n of deityTalents22(id).filter(x=>x.branch===branch.id)){const state=talentState22(id),rank=state[n.id]||0,owned=ext().companions[id]||0,locked=!owned||owned<n.required||n.depth>0&&!(state[`${n.branch}_${n.depth-1}`]>=3),cost=Math.ceil((80+c.cost*.2)*(n.depth+1)*(rank+1));const el=card(`<div class="talent-rank22">${rank} / ${n.max}</div><h3>${n.name}</h3><p>${n.desc}</p><small>${n.depth?`前置天賦 Lv.3 · 夥伴 Lv.${n.required}`:'根節點 · 招募後可學習'}</small><small>${rank>=n.max?'已達滿級':`1 天賦點 · ${fmt(cost)} 金幣`}</small>`,'talent-node22'+(locked?' locked':''));el.append(button(rank>=n.max?'已點滿':locked?'尚未解鎖':'提升天賦',()=>learnTalent22(id,n.id),locked||rank>=n.max||talentAvailable22(id)<1||ext().gold<cost,'primary'));col.append(el);
  }tree.append(col);
 }root.append(tree,button('重置這位夥伴的天賦',()=>resetTalents22(id),!talentSpent22(id)));
}
renderRecruit=function(parent){parent.append(panelIntro('主祀夥伴・天賦修行',`${COMPANIONS.length} 位守護夥伴，各自擁有 3 條分支、12 個天賦節點。最多 3 位出戰，夥伴培養上限 Lv.50。`));
 addFilters(parent,true,'搜尋主祀、廟宇或角色定位');const q=viewQuery.trim().toLowerCase(),rows=COMPANIONS.filter(c=>(!viewRegion||c.source.temples.some(t=>t.region===viewRegion))&&(!q||[c.name,c.role,...c.source.temples.map(t=>t.name)].join(' ').toLowerCase().includes(q))),start=addPagination(parent,rows.length),grid=document.createElement('div');grid.className='system-grid';
 for(const c of rows.slice(start,start+12)){const rank=ext().companions[c.id]||0,deployed=ext().party.includes(c.id),el=card(`<div class="companion-top"><div class="companion-icon">${c.icon}</div><span class="bear-tag">${c.role}${deployed?' · 出戰中':''}</span></div><h3>${esc(c.name)}</h3><div class="companion-level22">${rank?'Lv.'+rank:'尚未招募'}<span>天賦 ${talentSpent22(c.id)} 點</span></div><p>${esc(c.desc)}</p>`);
  if(!rank)el.append(button(`招募 · ${fmt(c.cost)} 金幣`,()=>recruit(c.id),ext().gold<c.cost,'primary'));else{const gold=Math.ceil(c.cost*rank*.65);el.append(button(deployed?'安排休息':'加入出戰',()=>toggleParty(c.id),false,'primary'),button(rank>=50?'已達滿級':`培養 · ${fmt(gold)} 金 / ${rank*3} 粉`,()=>upgradeCompanion(c.id),rank>=50||!afford({gold,dust:rank*3})));}el.append(button(`專屬天賦樹${rank?' · 可用 '+talentAvailable22(c.id)+' 點':''}`,()=>renderTalent22(c.id),false,'talent-button22'));grid.append(el);
 }parent.append(grid);
};
const SKILL_TYPES22={all:'全部',Physical:'物理',Magic:'法術',Heal:'治療',Support:'輔助',Passive:'被動'};
function categoryOfSkill22(s){return s.type;}
renderSkills21=function(parent){parent.append(panelIntro('技能殿堂・戰技與術式',`${Object.keys(EXT_SKILLS).length} 種主動技能 / ${Object.keys(PASSIVES).length} 種被動。主動最高 Lv.50、被動最高 Lv.30，自動技能仍維持 6 格。`));
 viewChips22(parent,SKILL_TYPES22,skillCategory22,key=>{skillCategory22=key;viewPage=1;renderSystem();});addFilters(parent,false,'搜尋名稱、元素或技能說明');const q=viewQuery.trim().toLowerCase(),entries=[...Object.entries(EXT_SKILLS).map(([id,m])=>({id,meta:m,skill:SKILLS[id],passive:false})),...Object.entries(PASSIVES).map(([id,p])=>({id,meta:{desc:p.desc},skill:{name:p.name,type:'Passive'},passive:true}))].filter(x=>(skillCategory22==='all'||x.skill.type===skillCategory22)&&[x.skill.name,x.meta.element,x.meta.desc].join(' ').toLowerCase().includes(q));
 const start=addPagination(parent,entries.length,16),grid=document.createElement('div');grid.className='system-grid skills-grid22';
 for(const x of entries.slice(start,start+16)){const {id,skill:s,meta:m,passive}=x,rank=(passive?ext().passives:ext().skillRanks)[id]||0,max=passive?30:50,cost=passive?{gold:(rank+1)*200,skillPoints:Math.max(1,Math.ceil((rank+1)/8))}:learnCost(id),el=card(`<span class="bear-tag">${SKILL_TYPES22[s.type]}${m.element?' · '+m.element:''}</span><h3>${esc(s.name)}</h3><div class="skill-level22">Lv.${rank}<small> / ${max}</small></div><p>${esc(m.desc)}</p><div class="bear-muted">${passive?'永久生效':`角色 Lv.${m.level} · MP ${s.cost} · 冷卻 ${s.cooldown} 回合`}<br>${rank>=max?'已達滿級':`${fmt(cost.gold)} 金幣 / ${cost.skillPoints} 技能點`}</div>`,passive?'passive':'');
  el.append(button(rank>=max?'已達滿級':rank?'提升等級':'學習技能',()=>passive?trainPassive(id):trainSkill(id),rank>=max||!passive&&player.level<m.level||!afford(cost),'primary'));
  if(!passive&&rank){const label=document.createElement('label');label.className='auto-label';const box=document.createElement('input');box.type='checkbox';box.checked=!!player.autoSkills[id];box.onchange=()=>partySetAuto(id,box.checked);label.append(box,' 自動施放');el.append(label);}grid.append(el);
 }parent.append(grid);
};
const renderAdventure21=renderAdventure;
renderAdventure=function(parent){renderAdventure21(parent);const cards=parent.querySelectorAll('.scene-grid .system-card');for(const n of cards){const heading=n.querySelector('h3'),scene=PENGHU_SOURCE.scenes.find(s=>s.name===heading?.textContent);if(!scene)continue;const art=n.querySelector('.scene-card-art');art.innerHTML=`<span>${esc(scene.region)} · ${esc(scene.category)}</span><i aria-hidden="true">${['◒','◈','✧','◇','◉'][hash(scene.id)%5]}</i>`;styleScene22(n,scene);n.querySelectorAll('p').forEach(p=>p.classList.add('scene-detail22'));}};
const renderHelp21=renderHelp;
renderHelp=function(parent){renderHelp21(parent);parent.prepend(panelIntro('操作與屬性對照','手機戰鬥頁可切換戰況、角色、技能與紀錄；下方固定導覽可進入所有功能。'));
 const labels=card('<h3>角色與裝備使用相同屬性</h3><p>物理攻擊 PATK，法術攻擊 MATK。MP 代表魔力，不是法術攻擊。舊裝備的 MPATK 會轉為 MATK。</p>');for(const [key,name]of Object.entries(STAT_LABELS22)){const row=document.createElement('div');row.className='stat-map22';row.innerHTML=`<strong>${name}</strong><span>${key}</span>`;labels.append(row);}parent.append(labels,card('<h3>夥伴天賦與委託</h3><p>每位主祀夥伴都有獨立天賦樹，三條分支各四層。招募取得 3 點，每培養 1 級再取得 1 點；下層需要前置天賦 3 級。天賦僅在該夥伴出戰時生效，可免費返還天賦點，金幣不退還。</p><p>商會有 48 種委託，分為戰鬥、商旅、工匠、探索與養成。每種都可完成多輪，領獎後下一輪目標會提高。</p>'));
};
// Replace only presentation and persistence boundaries; all original battle functions above remain captured unchanged.
const makeSave21=makeSave;
makeSave=function(){const d=makeSave21();d.schemaVersion=22;return d;};
const validateSave21=validateSave;
validateSave=function(data){if(data?.schemaVersion>22)throw Error('future-version');validateSave21({...data,schemaVersion:Math.min(21,data?.schemaVersion||0)});return data;};
saveGame=function(quiet=false){try{const data=makeSave();localStorage.setItem(V22_KEY,JSON.stringify(data));lastSaveTime=data.lastSaveTime;document.getElementById('last-save-time').textContent=new Date(lastSaveTime).toLocaleString('zh-TW');saveWarning=false;if(quiet!==true)notify('冒險進度已保存。');return true;}catch(e){if(!saveWarning||quiet!==true)notify('無法保存，請使用匯出進度備份。');saveWarning=true;return false;}};
loadGame=function(){for(const key of [V22_KEY,V21_KEY,EXT_KEY,STORAGE_KEY]){try{const raw=localStorage.getItem(key);if(raw){applySave(JSON.parse(raw));return true;}}catch(e){continue;}}return false;};
const app21=window.BearChronicleApp;
window.BearChronicleApp=Object.freeze({...app21,version:'22.0.0',getCatalog:()=>({...app21.getCatalog(),companions:COMPANIONS.map(c=>({id:c.id,name:c.name,role:c.role,talents:deityTalents22(c.id)}))}),dispatch:(action,payload={})=>action==='learnTalent'?learnTalent22(payload.id,payload.nodeId):action==='claimCommission'?claimMission(payload.id):app21.dispatch(action,payload)});
const handoffText21=handoffText;
handoffText=function(){return handoffText21().replace(/v21/g,'v22').replace('96 種夥伴','90 種主祀夥伴（每位 12 個專屬天賦節點）').replace('32 種主動技能','144 種主動技能').replace('10 種被動','24 種被動')+'\n\n本版戰鬥時序與結算沿用 v21，請勿更動。新介面採固定導覽、獨立捲動與手機戰況分區。商會委託已擴充為 48 種。角色與裝備屬性必須共用統一對照。';};
document.addEventListener('DOMContentLoaded',()=>{
 document.body.dataset.page='battle';document.getElementById('main-game').dataset.combatView='overview';document.querySelectorAll('[data-combat-view]').forEach(b=>b.onclick=()=>combatViewSwitch22(b.dataset.combatView));
 document.getElementById('missions-shortcut22').onclick=()=>{guildTab='missions';setView('guild');};document.getElementById('battle-skills-shortcut22').onclick=()=>setView('skills');
 document.getElementById('talentModal22').onclick=e=>{if(e.target===e.currentTarget)e.currentTarget.style.display='none';};
 const close=document.getElementById('talent-close22');close.onclick=()=>document.getElementById('talentModal22').style.display='none';close.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();close.click();}};
 renderZoneUI();updatePlayerUI();updateMonsterUI();combatViewSwitch22('overview');
});
// Keep reading position in the log, and avoid replacing equipment controls while a finger is down.
const logCombat21=logCombat;
logCombat=function(message,kind){const node=document.getElementById('log-output'),top=node.scrollTop||0,near=(node.scrollHeight||0)-top-(node.clientHeight||0)<80;logCombat21(message,kind);if(!near)node.scrollTop=top;};
let pointerBusy22=false,lastEquipmentStamp22='';
const renderEquipmentSlots21=renderEquipmentSlots;
renderEquipmentSlots=function(){if(pointerBusy22||document.getElementById('statsModal').style.display!=='block')return;const stamp=JSON.stringify([player.equipment,player.level,ext().gold,ext().dust,ext().crystal]);if(stamp===lastEquipmentStamp22)return;lastEquipmentStamp22=stamp;renderEquipmentSlots21();};
document.addEventListener('pointerdown',()=>{pointerBusy22=true;});
document.addEventListener('pointerup',()=>{pointerBusy22=false;});
document.addEventListener('pointercancel',()=>{pointerBusy22=false;});
function markNav22(tab){document.querySelectorAll('[data-system]').forEach(b=>{b.classList.toggle('active',b.dataset.system===tab);b.setAttribute('aria-pressed',b.dataset.system===tab);});}
document.addEventListener('DOMContentLoaded',()=>{
 document.getElementById('open-stats').addEventListener('click',()=>markNav22('equipment'));
 const close=document.querySelector('#statsModal .close-btn'),original=close.onclick;close.onclick=e=>{original(e);markNav22(pageView);};
 window.addEventListener('click',e=>{if(e.target===document.getElementById('statsModal')&&e.target.style.display==='none')markNav22(pageView);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')markNav22(pageView);});
});

