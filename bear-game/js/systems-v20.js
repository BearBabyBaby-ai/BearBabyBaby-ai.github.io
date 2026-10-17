
// 熊寶 v20：在原版即時戰鬥上擴充，可離線使用。
const EXT_KEY = 'BearChronicleV20';
const EXT_SKILLS = {
  heavy_hit:{level:1,desc:'蓄力打擊單一敵人。'},
  blizzard:{level:1,desc:'冰雪掃過全體敵人。'},
  meteor:{level:1,desc:'隕石轟擊全體敵人。'},
  heal:{level:1,desc:'生命低於 50% 時優先自動治療。'},
  bear_claw:{level:3,desc:'熊寶揮出強力熊掌。'},
  sea_wave:{level:5,desc:'海浪衝擊全體敵人。'},
  starfall:{level:10,desc:'星光灑落，造成全體法術傷害。'},
  bear_roar:{level:15,desc:'熊寶咆哮，造成全體物理傷害。'}
};
Object.assign(SKILLS, {
  bear_claw:{name:'熊掌連擊',cost:16,type:'Physical',target:'Single',multiplier:2.4,isAuto:true,cooldown:4},
  sea_wave:{name:'碧海衝擊',cost:30,type:'Magic',target:'Area',multiplier:1.8,isAuto:true,cooldown:6},
  starfall:{name:'星光墜落',cost:48,type:'Magic',target:'Area',multiplier:3.2,isAuto:true,cooldown:9},
  bear_roar:{name:'熊寶咆哮',cost:45,type:'Physical',target:'Area',multiplier:3.6,isAuto:true,cooldown:10}
});
SKILLS.heavy_hit.cooldown=2; SKILLS.blizzard.cooldown=5; SKILLS.meteor.cooldown=8; SKILLS.heal.cooldown=5;
const PASSIVES = {power:{name:'熊之力量',desc:'每級物攻與法攻 +5%。'},guard:{name:'堅毅守護',desc:'每級物防與法防 +5%。'},fortune:{name:'商旅直覺',desc:'每級擊殺金幣 +8%、裝備掉落率 +1%。'}};
const COMPANIONS = [
 {id:'guard',name:'岩盾',icon:'🛡️',role:'守護者',cost:200,desc:'每級增加 10 物防、8 法防。'},
 {id:'archer',name:'逐風',icon:'🏹',role:'遊俠',cost:300,desc:'每秒射擊：12 + 熊寶物攻 × 0.35，每級疊加。'},
 {id:'mage',name:'星羽',icon:'🔮',role:'法師',cost:400,desc:'每 4 秒全體法術：20 + 熊寶法攻 × 0.5，每級疊加。'},
 {id:'healer',name:'沐光',icon:'🌿',role:'治療師',cost:350,desc:'每 4 秒恢復熊寶最大生命的 4%，每級疊加。'},
 {id:'warrior',name:'赤炎',icon:'⚔️',role:'戰士',cost:500,desc:'每 2 秒斬擊：25 + 熊寶物攻 × 0.7，每級疊加。'},
 {id:'merchant',name:'錢多多',icon:'💰',role:'商旅',cost:250,desc:'每級增加擊殺金幣 10%、裝備販售價格 5%。'}
];
const freshExtension=()=>({version:20,gold:1200,dust:25,crystal:3,skillPoints:6,kills:0,sold:0,dismantled:0,guildXP:0,
  companions:{},party:[],skillRanks:{heavy_hit:1,blizzard:1,meteor:1,heal:1},passives:{power:0,guard:0,fortune:0},
  offers:[],shopAt:0,missions:{},paused:false,starterGranted:false});
const nint=(v,d=0,max=1e12)=>Number.isFinite(Number(v))?Math.min(max,Math.max(0,Math.floor(Number(v)))):d;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Math.floor(n).toLocaleString('zh-TW');
let activeSystem='recruit', companionTicks=0, toastTimer;
function ext(){return player.extension;}
function migratePlayer(){
  player.name='熊寶';
  player.autoSkills={heavy_hit:true,blizzard:true,meteor:false,heal:true,...player.autoSkills};
  player.inventory=Array.isArray(player.inventory)?player.inventory:[];
  player.equipment=player.equipment&&typeof player.equipment==='object'?player.equipment:{};
  player.level=Math.max(1,nint(player.level,1,10000));
  const base=freshExtension(), old=player.extension;
  player.extension={...base,...(old&&typeof old==='object'?old:{})};
  const e=ext();
  for(const k of ['gold','dust','crystal','skillPoints','kills','sold','dismantled','guildXP','shopAt'])e[k]=nint(e[k],base[k]);
  e.skillRanks={...base.skillRanks,...e.skillRanks}; e.passives={...base.passives,...e.passives};
  for(const id of Object.keys(EXT_SKILLS))e.skillRanks[id]=nint(e.skillRanks[id],0,50);
  for(const id of Object.keys(PASSIVES))e.passives[id]=nint(e.passives[id],0,30);
  e.companions=e.companions&&typeof e.companions==='object'?e.companions:{};
  for(const k of Object.keys(e.companions)){if(!COMPANIONS.some(c=>c.id===k))delete e.companions[k];else e.companions[k]=Math.max(1,nint(e.companions[k],1,50));}
  e.party=Array.isArray(e.party)?[...new Set(e.party)].filter(k=>e.companions[k]).slice(0,3):[];
  e.missions=e.missions&&typeof e.missions==='object'?e.missions:{};
  e.offers=Array.isArray(e.offers)?e.offers:[];e.paused=e.paused===true;
  const valid=i=>i&&EQUIPMENT_SLOTS[i.slot]&&TIER_CONFIG[i.tier]&&i.stats&&typeof i.stats==='object';
  player.inventory=player.inventory.filter(valid);
  e.offers=e.offers.filter(o=>o&&valid(o.item)).map(o=>({...o,price:Math.max(1,nint(o.price,100)),sold:!!o.sold}));
  for(const slot of Object.keys(EQUIPMENT_SLOTS))if(!valid(player.equipment[slot]))player.equipment[slot]=null;
  for(const item of [...player.inventory,...Object.values(player.equipment).filter(Boolean),...e.offers.map(o=>o.item).filter(Boolean)])normalizeItem(item);
  if(!e.starterGranted){
    e.starterGranted=true;
    if(!player.inventory.length&&!Object.values(player.equipment).some(Boolean)){
      player.inventory.push(makeItem(1,'T1','WEAPON'),makeItem(1,'T1','CHEST'),makeItem(1,'T0','BOOTS'));
      logCombat('🎁 熊寶的冒險補給：1,200 金幣、25 強化粉塵、3 位階結晶、6 技能點與 3 件裝備。','log-status');
    }
  }
}
function normalizeItem(i){
  i.minLevel=Math.max(1,nint(i.minLevel,1,10000)); i.enhance=nint(i.enhance,0,20); i.locked=!!i.locked;
  if(!i.baseStats||typeof i.baseStats!=='object'||Array.isArray(i.baseStats))i.baseStats={...i.stats};
  if(!i.id||!['string','number'].includes(typeof i.id))i.id=newId();i.name=typeof i.name==='string'?i.name.slice(0,120):`${TIER_CONFIG[i.tier].display} ${EQUIPMENT_SLOTS[i.slot]}`;
  for(const key of Object.keys(i.baseStats)){if(!STAT_KEYS.includes(key))delete i.baseStats[key];else i.baseStats[key]=nint(i.baseStats[key]);}
}
function newId(){return globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;}
function getItemStats(item){
  normalizeItem(item); const factor=1+item.enhance*0.1;
  return Object.fromEntries(Object.entries(item.baseStats).map(([k,v])=>[k,Math.floor(v*factor)]));
}
const generateItemV19=generateItem;
generateItem=function(level,bonus=0){const i=generateItemV19(level,bonus);i.id=newId();i.enhance=0;i.locked=false;
  const tier=Number(i.tier.slice(1)), scaled=Math.max(1,Math.round(i.minLevel*(1+tier*.55)));
  const main=i.slot==='WEAPON'?'PATK':['NECK','RING1','RING2'].includes(i.slot)?'MATK':'PDEF';
  i.stats[main]=Math.max(i.stats[main]||0,scaled);i.baseStats={...i.stats};return i;
};
function makeItem(level,tier,slot){const i=generateItem(level);i.minLevel=level;i.tier=tier;i.slot=slot;const t=Number(tier.slice(1));
  i.name=`${TIER_CONFIG[tier].display} ${EQUIPMENT_SLOTS[slot]}`;
  const main=slot==='WEAPON'?'PATK':['NECK','RING1','RING2'].includes(slot)?'MATK':'PDEF';
  i.stats={[main]:Math.max(2,Math.round((level+3)*(1+t*.6))),CON:Math.max(1,Math.round((level+1)*(1+t*.25)))};
  i.baseStats={...i.stats};return i;
}
function notify(message){const node=document.getElementById('bear-toast');node.textContent=message;node.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.hidden=true,3200);}
function partyRank(id){return ext().party.includes(id)?ext().companions[id]||0:0;}
const calculateStatsV19=calculateStats;
calculateStats=function(){
  calculateStatsV19();if(!player.extension)return;
  const e=ext(), g=partyRank('guard'); player.PATK=Math.floor(player.PATK*(1+e.passives.power*.05));player.MATK=Math.floor(player.MATK*(1+e.passives.power*.05));
  player.PDEF=Math.floor((player.PDEF+g*10)*(1+e.passives.guard*.05));player.MDEF=Math.floor((player.MDEF+g*8)*(1+e.passives.guard*.05));
  player.PDR=Math.min(90,Math.floor(player.PDEF*.5));player.MDR=Math.min(90,Math.floor(player.MDEF*.5));
};
const initializeGameV19=initializeGame;
initializeGame=function(){migratePlayer();clearInterval(gameLoopInterval);clearInterval(regenLoopInterval);clearInterval(autoSaveTimer);companionTicks=0;initializeGameV19();renderInventory();renderSystem();};
const updatePlayerUIV19=updatePlayerUI;
updatePlayerUI=function(){updatePlayerUIV19();if(!player.extension)return;renderWallet();
 document.getElementById('cooldown-status').textContent=ext().paused?'⏸ 已暫停戰鬥':player.isDefeated?'❌ 戰敗冷卻中':'⚔️ 戰鬥中';
 document.getElementById('party-status').textContent=ext().party.length?ext().party.map(k=>COMPANIONS.find(c=>c.id===k).name).join('、'):'尚無出戰夥伴';
 document.getElementById('pause-button').textContent=ext().paused?'▶ 繼續戰鬥':'⏸ 暫停戰鬥';
};
function renderWallet(){for(const [id,key] of [['wallet-gold','gold'],['wallet-dust','dust'],['wallet-crystal','crystal'],['wallet-sp','skillPoints']])document.getElementById(id).textContent=fmt(ext()[key]);}
function itemTitle(i){return `${i.name} +${i.enhance||0}`;}
function itemInfo(i){return `裝備 Lv.${i.minLevel} · ${i.tier} ${TIER_CONFIG[i.tier].display} · 強化 +${i.enhance||0}`;}
function statsText(i){return Object.entries(getItemStats(i)).filter(([,v])=>v).map(([k,v])=>`${k} +${fmt(v)}`).join('　');}
function saleValue(i){return Math.max(1,Math.floor((20+i.minLevel*8)*(1+Number(i.tier.slice(1))*.8)*(1+(i.enhance||0)*.12)*(1+partyRank('merchant')*.05)));}
function dismantleValue(i){return {dust:Math.ceil((1+Number(i.tier.slice(1)))*Math.max(1,i.minLevel/10))+(i.enhance||0)*2,crystal:Number(i.tier.slice(1))>=3?Number(i.tier.slice(1))-2:0};}
function enhanceCost(i){return {gold:Math.ceil((40+i.minLevel*10)*(i.enhance+1)*(1+Number(i.tier.slice(1))*.35)),dust:(i.enhance+1)*(Number(i.tier.slice(1))+1)};}
function gearLevelCost(i){return {gold:(i.minLevel+1)*40,dust:Math.ceil(i.minLevel/5)+1};}
function tierCost(i){const t=Number(i.tier.slice(1));return {gold:(t+1)*500+i.minLevel*30,crystal:(t+1)*2,dust:(t+1)*15};}
function byId(id){return [...player.inventory,...Object.values(player.equipment).filter(Boolean)].find(i=>String(i.id)===String(id));}
function afford(c){return Object.entries(c).every(([k,v])=>ext()[k]>=v);}
function spend(c){if(!afford(c)){notify('資源不足，請戰鬥、分解裝備或前往商會。');return false;}for(const [k,v]of Object.entries(c))ext()[k]-=v;return true;}
function changed(message){calculateStats();updatePlayerUI();renderInventory();renderSkills();renderSystem();if(message){notify(message);logCombat(esc(message),'log-status');}if(autoSaveEnabled)saveGame(true);}
function button(label,action,disabled=false,kind=''){const b=document.createElement('button');b.type='button';b.className=`bear-btn ${kind}`;b.textContent=label;b.disabled=disabled;b.onclick=action;return b;}
renderInventory=function(){
 const list=document.getElementById('inventory-list');list.replaceChildren();
 const items=player.inventory.filter(i=>inventoryFilter==='ALL'||i.tier===inventoryFilter);
 const pages=Math.max(1,Math.ceil(items.length/INVENTORY_ITEMS_PER_PAGE));inventoryCurrentPage=Math.min(pages,Math.max(1,inventoryCurrentPage));
 document.getElementById('inventory-count').textContent=player.inventory.length;
 document.getElementById('inventory-max').textContent=fmt(player.level*MAX_INVENTORY_MULTIPLIER);
 document.getElementById('page-info').textContent=`第 ${inventoryCurrentPage} / ${pages} 頁 · 篩選 ${items.length} 件`;
 document.getElementById('prev-page-btn').disabled=inventoryCurrentPage<=1;document.getElementById('next-page-btn').disabled=inventoryCurrentPage>=pages;
 for(const i of items.slice((inventoryCurrentPage-1)*30,inventoryCurrentPage*30)){
  const card=document.createElement('article');card.className='bear-item';
  const ec=enhanceCost(i),dv=dismantleValue(i),lc=gearLevelCost(i);
  card.innerHTML=`<div class="item-heading ${TIER_CONFIG[i.tier].color}">${i.locked?'🔒 ':''}${esc(itemTitle(i))}</div><div class="bear-muted">${esc(itemInfo(i))} · ${EQUIPMENT_SLOTS[i.slot]}</div><div class="item-stats">${esc(statsText(i))}</div>`;
  const acts=document.createElement('div');acts.className='bear-actions';
  acts.append(button('裝備',()=>equipItem(i),player.level<i.minLevel),button(i.locked?'解鎖':'鎖定',()=>{i.locked=!i.locked;changed();}),
  button(`強化 ${fmt(ec.gold)}金 / ${ec.dust}粉`,()=>enhanceItem(i.id),i.enhance>=20||!afford(ec)),
  button(`提升等級 ${fmt(lc.gold)}金 / ${lc.dust}粉`,()=>levelGear(i.id),i.minLevel>=player.level||!afford(lc)),
  button(`分解 ${dv.dust}粉${dv.crystal?` / ${dv.crystal}晶`:''}`,()=>processItems('dismantle',[i.id]),i.locked),
  button(`販售 ${fmt(saleValue(i))}金`,()=>processItems('sell',[i.id]),i.locked));
  if(i.tier!=='T5'){const c=tierCost(i);acts.append(button(`升階 ${fmt(c.gold)}金 / ${c.dust}粉 / ${c.crystal}晶`,()=>promoteItem(i.id),!afford(c)));}
  card.append(acts);list.append(card);
 }
 if(!items.length)list.innerHTML='<p class="bear-empty">目前沒有符合條件的裝備。戰鬥掉落與商會購買都會放入這裡。</p>';
 const candidates=batchCandidates(),d=candidates.reduce((a,i)=>a+dismantleValue(i).dust,0),c=candidates.reduce((a,i)=>a+dismantleValue(i).crystal,0),g=candidates.reduce((a,i)=>a+saleValue(i),0);
 document.getElementById('batch-summary').textContent=`目前可處理 ${candidates.length} 件 · 分解 ${fmt(d)} 粉塵 / ${fmt(c)} 結晶，或販售 ${fmt(g)} 金幣。`;
 document.getElementById('mass-delete-button').disabled=!candidates.length;document.getElementById('batch-sell-button').disabled=!candidates.length;
};
function batchCandidates(){const limit=Number(document.getElementById('batch-tier').value),protect=document.getElementById('protect-enhanced').checked;
 return player.inventory.filter(i=>(inventoryFilter==='ALL'||i.tier===inventoryFilter)&&Number(i.tier.slice(1))<=limit&&!i.locked&&(!protect||!i.enhance));}
function processItems(mode,ids){
 const wanted=new Set(ids.map(String)),items=player.inventory.filter(i=>wanted.has(String(i.id))&&!i.locked);
 if(!items.length){notify('沒有可處理的裝備；鎖定與穿戴中的裝備會受到保護。');return;}
 const gold=items.reduce((s,i)=>s+saleValue(i),0),dust=items.reduce((s,i)=>s+dismantleValue(i).dust,0),crystal=items.reduce((s,i)=>s+dismantleValue(i).crystal,0);
 const reward=mode==='sell'?`${fmt(gold)} 金幣`:`${fmt(dust)} 粉塵、${fmt(crystal)} 結晶`;
 if(!confirm(`確定${mode==='sell'?'販售':'分解'} ${items.length} 件裝備？\n獲得 ${reward}\n裝備處理後無法還原。`))return;
 // Dialog blocks gameplay; re-resolve IDs before committing to avoid stale UI operations.
 const remove=new Set(items.map(i=>String(i.id)));player.inventory=player.inventory.filter(i=>!remove.has(String(i.id)));
 if(mode==='sell'){ext().gold+=gold;ext().sold+=items.length;ext().guildXP+=items.length*2;}else{ext().dust+=dust;ext().crystal+=crystal;ext().dismantled+=items.length;}
 changed(`已${mode==='sell'?'販售':'分解'} ${items.length} 件裝備，獲得 ${reward}。`);
}
deleteFilteredItems=function(){processItems('dismantle',batchCandidates().map(i=>i.id));};
function levelGear(id){const i=byId(id);if(!i||i.minLevel>=player.level){notify('裝備等級不可超過熊寶目前的角色等級。');return;}if(!spend(gearLevelCost(i)))return;const factor=(i.minLevel+4)/(i.minLevel+3);i.minLevel++;for(const k of Object.keys(i.baseStats))if(i.baseStats[k]>0)i.baseStats[k]=Math.max(i.baseStats[k]+1,Math.round(i.baseStats[k]*factor));i.stats={...i.baseStats};changed(`${i.name} 提升至裝備 Lv.${i.minLevel}。`);}
function enhanceItem(id){const i=byId(id);if(!i||i.enhance>=20)return;if(!spend(enhanceCost(i)))return;i.enhance++;changed(`${i.name} 強化成功，現在 +${i.enhance}！`);}
function promoteItem(id){const i=byId(id);if(!i||i.tier==='T5')return;const c=tierCost(i);if(!confirm(`將 ${i.name} 升至 ${TIER_CONFIG['T'+(Number(i.tier.slice(1))+1)].display}？\n消耗 ${fmt(c.gold)} 金幣、${c.dust} 粉塵、${c.crystal} 結晶；基礎屬性 +25%。`))return;if(!spend(c))return;
 i.tier='T'+(Number(i.tier.slice(1))+1);for(const k of Object.keys(i.baseStats))i.baseStats[k]=Math.max(i.baseStats[k]+1,Math.ceil(i.baseStats[k]*1.25));i.stats={...i.baseStats};i.name=`${TIER_CONFIG[i.tier].display} ${EQUIPMENT_SLOTS[i.slot]}`;changed(`${i.name} 升階成功！`);
}
const equipItemV19=equipItem;
equipItem=function(item){if(!player.inventory.some(i=>i.id===item.id))return;equipItemV19(item);if(player.equipment[item.slot]===item)changed();};
const unequipItemV19=unequipItem;
unequipItem=function(slot){unequipItemV19(slot);changed();};
createItemTooltip=function(i){const div=document.createElement('div');div.className='item-tooltip';div.textContent=`${itemTitle(i)}｜${itemInfo(i)}｜${statsText(i)}`;return div;};
renderEquipmentSlots=function(){const grid=document.getElementById('equipment-slots-grid');grid.replaceChildren();for(const slot of Object.keys(EQUIPMENT_SLOTS)){
 const i=player.equipment[slot],card=document.createElement('article');card.className='equipment-slot';
 card.innerHTML=`<strong>${EQUIPMENT_SLOTS[slot]}</strong><div class="${i?TIER_CONFIG[i.tier].color:''}">${i?esc(itemTitle(i)):'未裝備'}</div>${i?`<small>${esc(itemInfo(i))}</small><small>${esc(statsText(i))}</small>`:''}`;
 if(i){const c=enhanceCost(i);card.append(button('卸下',()=>unequipItem(slot)),button(`強化 ${fmt(c.gold)}金 / ${c.dust}粉`,()=>enhanceItem(i.id),i.enhance>=20||!afford(c)));const lc=gearLevelCost(i);card.append(button(`升級 ${fmt(lc.gold)}金 / ${lc.dust}粉`,()=>levelGear(i.id),i.minLevel>=player.level||!afford(lc)));if(i.tier!=='T5'){const t=tierCost(i);card.append(button(`升階 ${fmt(t.gold)}金 / ${t.dust}粉 / ${t.crystal}晶`,()=>promoteItem(i.id),!afford(t)));}}grid.append(card);
}};
function effectiveSkill(id){const s=SKILLS[id],rank=ext().skillRanks[id]||0;return {...s,multiplier:s.multiplier*(1+Math.max(0,rank-1)*.12)};}
function learnCost(id){const rank=ext().skillRanks[id]||0;return {gold:120*(rank+1),skillPoints:rank?2:1};}
function trainSkill(id){const rank=ext().skillRanks[id]||0;if(rank>=10||player.level<EXT_SKILLS[id].level)return;if(!spend(learnCost(id)))return;ext().skillRanks[id]=rank+1;if(!rank)player.autoSkills[id]=true;changed(`${SKILLS[id].name} 已提升至 Lv.${rank+1}。`);}
function trainPassive(id){const rank=ext().passives[id];if(rank>=10)return;if(!spend({gold:(rank+1)*200,skillPoints:2}))return;ext().passives[id]++;changed(`${PASSIVES[id].name} 已提升至 Lv.${rank+1}。`);}
renderSkills=function(){const area=document.getElementById('skill-area');area.replaceChildren();
 const p=document.createElement('p');p.className='bear-muted';p.textContent='MP 不足或技能冷卻時改用普通攻擊；治癒術於生命低於 50% 優先施放。';area.append(p);
 for(const [id,meta]of Object.entries(EXT_SKILLS)){
  const rank=ext().skillRanks[id]||0;if(!rank)continue;
  const row=document.createElement('label');row.className='bear-skill-row';
  row.innerHTML=`<span><strong>${SKILLS[id].name} Lv.${rank}</strong><small>MP ${SKILLS[id].cost} · CD ${SKILLS[id].cooldown}秒</small></span>`;
  const box=document.createElement('input');box.type='checkbox';box.checked=!!player.autoSkills[id];box.dataset.skillId=id;
  box.onchange=()=>{player.autoSkills[id]=box.checked;changed();};row.append(box);area.append(row);
 }
 const b=button('開啟技能研習 →',()=>openSystem('skills'));area.append(b);
};
performAutoSkills=function(target,isAttempt=false){
 const usable=id=>(ext().skillRanks[id]||0)>0&&player.autoSkills[id]&&(skillCooldowns[id]||0)<=0&&player.currentMP>=SKILLS[id].cost;
 const cast=id=>{if(!isAttempt)useSkill(effectiveSkill(id),SKILLS[id].type==='Heal'?null:SKILLS[id].target==='Area'?monsters.filter(m=>m.currentHP>0):target,id);return true;};
 if(player.currentHP/player.maxHP<.5&&usable('heal'))return cast('heal');
 // Alternate to the next available skill through independent cooldowns; preserve the original one-action-per-tick rule.
 for(const id of Object.keys(EXT_SKILLS))if(id!=='heal'&&usable(id))return cast(id);
 return false;
};
function manualSkill(id){if(player.isDefeated||!(ext().skillRanks[id]>0))return;if((skillCooldowns[id]||0)>0){notify(`技能冷卻中：${skillCooldowns[id]} 秒。`);return;}if(player.currentMP<SKILLS[id].cost){notify('MP 不足。');return;}
 const targets=monsters.filter(m=>m.currentHP>0);if(SKILLS[id].type!=='Heal'&&!targets.length)return;
 useSkill(effectiveSkill(id),SKILLS[id].type==='Heal'?null:SKILLS[id].target==='Area'?targets:targets[0],id);renderSystem();
}
const levelUpV19=levelUp;
levelUp=function(){levelUpV19();ext().skillPoints+=2;ext().gold+=50;renderSkills();logCombat('🌟 升級獎勵：技能點 +2、金幣 +50。','log-status');};
const createMonsterV19=createMonster;
createMonster=function(level){const m=createMonsterV19(level);m.id=newId();m.isSpecial=/^\[(BOSS|首領|菁英)\]/.test(m.name);return m;};
const handleMonsterDefeatV19=handleMonsterDefeat;
handleMonsterDefeat=function(m){if(m.rewarded)return;m.rewarded=true;const gain=Math.max(1,Math.floor((10+m.level*3)*(m.isSpecial?2:1)*(1+ext().passives.fortune*.08+partyRank('merchant')*.1)));
 ext().gold+=gain;ext().kills++;logCombat(`💰 擊殺獲得 ${fmt(gain)} 金幣。`,'log-item-drop');handleMonsterDefeatV19(m);
 if(document.getElementById('statsModal').style.display==='block')renderInventory();
};
const handleItemDropV19=handleItemDrop;
handleItemDrop=function(m){handleItemDropV19(m);if(ext().passives.fortune&&Math.random()<ext().passives.fortune*.01&&player.inventory.length<player.level*MAX_INVENTORY_MULTIPLIER){const i=generateItem(m.level,0);player.inventory.push(i);logCombat(`🍀 商旅直覺額外獲得 ${esc(i.name)}。`,'log-item-drop');}};
function companionsAct(){
 companionTicks++;for(const id of ext().party){const r=partyRank(id);if(!r)continue;const meta=COMPANIONS.find(c=>c.id===id);
  if(id==='healer'&&companionTicks%4===0){const heal=Math.floor(player.maxHP*.04*r);player.currentHP=Math.min(player.maxHP,player.currentHP+heal);logCombat(`🌿 沐光恢復 ${fmt(heal)} 點生命。`,'log-heal');continue;}
  if(!['archer','mage','warrior'].includes(id)||(id==='mage'&&companionTicks%4)||(id==='warrior'&&companionTicks%2))continue;
  const live=monsters.filter(m=>m.currentHP>0);const targets=id==='mage'?live:live.slice(0,1);
  for(const m of targets){const raw=id==='mage'?(20+player.MATK*.5)*r:id==='warrior'?(25+player.PATK*.7)*r:(12+player.PATK*.35)*r;
   const dmg=Math.max(1,Math.floor(raw*(100/(100+(id==='mage'?m.MDEF:m.PDEF)||100))));m.currentHP-=dmg;logCombat(`${meta.icon} ${meta.name} 對 ${esc(m.name)} 造成 ${fmt(dmg)} 點傷害。`,id==='mage'?'log-skill-magic':'log-skill-phys');if(m.currentHP<=0)handleMonsterDefeat(m);}
 }
}
const gameLoopV19=gameLoop, regenLoopV19=regenLoop;
gameLoop=function(){if(ext().paused)return;gameLoopV19();if(!player.isDefeated)companionsAct();updatePlayerUI();updateMonsterUI();if(document.getElementById('systemsModal').style.display==='block')updateLiveSystem();};
regenLoop=function(){if(!ext().paused)regenLoopV19();};
const logCombatV19=logCombat;
logCombat=function(message,kind){logCombatV19(message,kind);const node=document.getElementById('log-output');while(node.children.length>400)node.children[0].remove();};
function guildRank(){return Math.min(10,1+Math.floor(ext().guildXP/200));}
function shopPrice(v){return Math.ceil(v*(1-(guildRank()-1)*.02));}
function refreshShop(paid=false){const e=ext();if(paid&&!spend({gold:100}))return;if(!paid&&e.offers.length&&Date.now()-e.shopAt<300000)return;
 e.shopAt=Date.now();e.offers=Array.from({length:6},(_,idx)=>{const tier='T'+Math.min(5,Math.floor(idx/2)+Math.floor((guildRank()-1)/3));const i=makeItem(player.level,tier,Object.keys(EQUIPMENT_SLOTS)[Math.floor(Math.random()*9)]);return {item:i,price:(80+player.level*20)*(Number(tier.slice(1))+1)*2,sold:false};});
 if(paid)changed('商會商品已更新。');
}
function buyOffer(index){const o=ext().offers[index];if(!o||o.sold)return;if(player.inventory.length>=player.level*MAX_INVENTORY_MULTIPLIER){notify('背包已滿。');return;}if(!spend({gold:shopPrice(o.price)}))return;o.sold=true;player.inventory.push(o.item);ext().guildXP+=5;changed(`購買 ${o.item.name} 成功。`);}
function buySupply(kind){const offer={dust:{price:160,resource:'dust',amount:10},crystal:{price:350,resource:'crystal',amount:1},sp:{price:500,resource:'skillPoints',amount:2}}[kind];if(!offer||!spend({gold:shopPrice(offer.price)}))return;ext()[offer.resource]+=offer.amount;ext().guildXP+=5;changed('商會物資購買成功。');}
function recruit(id){const c=COMPANIONS.find(c=>c.id===id);if(!c||ext().companions[id])return;if(!spend({gold:c.cost}))return;ext().companions[id]=1;if(ext().party.length<3)ext().party.push(id);changed(`${c.name} 已加入隊伍！`);}
function toggleParty(id){const e=ext();if(!e.companions[id])return;if(e.party.includes(id))e.party=e.party.filter(k=>k!==id);else{if(e.party.length>=3){notify('最多出戰 3 位夥伴，請先讓一位休息。');return;}e.party.push(id);}changed();}
function upgradeCompanion(id){const c=COMPANIONS.find(c=>c.id===id),r=ext().companions[id];if(!c||!r||r>=20)return;if(!spend({gold:Math.ceil(c.cost*r*.65),dust:r*3}))return;ext().companions[id]++;changed(`${c.name} 提升至 Lv.${r+1}。`);}
const MISSIONS=[{id:'hunt',name:'清剿委託',key:'kills',step:20},{id:'trade',name:'商旅委託',key:'sold',step:5},{id:'recycle',name:'資源回收',key:'dismantled',step:5}];
function missionData(m){const done=nint(ext().missions[m.id]),target=(done+1)*m.step;return {done,target,current:ext()[m.key],gold:200*(done+1),xp:60,sp:1};}
function claimMission(id){const m=MISSIONS.find(x=>x.id===id);if(!m)return;const d=missionData(m);if(d.current<d.target)return;ext().missions[id]=d.done+1;ext().gold+=d.gold;ext().guildXP+=d.xp;ext().skillPoints+=d.sp;changed(`委託完成：${fmt(d.gold)} 金幣、60 商會聲望、1 技能點。`);}
function donateGuild(){if(guildRank()>=10)return;if(!spend({gold:200}))return;ext().guildXP+=40;changed('捐獻完成：商會聲望 +40。');}
function openSystem(tab){activeSystem=tab;document.getElementById('systemsModal').style.display='block';renderSystem();}
function renderSystem(){if(!player.extension)return;const content=document.getElementById('system-content');if(!content)return;
 document.querySelectorAll('[data-system]').forEach(b=>{b.classList.toggle('active',b.dataset.system===activeSystem);b.setAttribute('aria-pressed',b.dataset.system===activeSystem);});
 content.replaceChildren();
 if(activeSystem==='recruit'){
  content.innerHTML=`<div class="system-intro"><h2>旅途有伴，冒險加倍</h2><p>已出戰 ${ext().party.length} / 3 位 · 招募後永久保留，最高 Lv.20。夥伴會自動協助戰鬥。</p></div>`;
  const grid=document.createElement('div');grid.className='system-grid';
  for(const c of COMPANIONS){const r=ext().companions[c.id]||0,inParty=ext().party.includes(c.id),card=document.createElement('article');card.className='system-card';
   card.innerHTML=`<div class="companion-icon">${c.icon}</div><span class="bear-tag">${c.role}</span><h3>${c.name} ${r?`<small>Lv.${r}</small>`:''}</h3><p>${c.desc}</p><div class="bear-muted">${r?inParty?'● 出戰中':'休息中':`招募 ${fmt(c.cost)} 金幣`}</div>`;
   if(!r)card.append(button('招募夥伴',()=>recruit(c.id),ext().gold<c.cost,'primary'));
   else{card.append(button(inParty?'休息':'出戰',()=>toggleParty(c.id),false,'primary'));const cost={gold:Math.ceil(c.cost*r*.65),dust:r*3};card.append(button(r>=20?'已達滿級':`培養 ${fmt(cost.gold)}金 / ${cost.dust}粉`,()=>upgradeCompanion(c.id),r>=20||!afford(cost)));}grid.append(card);
  }content.append(grid);
 }else if(activeSystem==='skills'){
  content.innerHTML='<div class="system-intro"><h2>熊寶的技能研習所</h2><p>技能最高 Lv.10，每次升級效果 +12%。升級角色可得 2 技能點，也可向商會購買。勾選自動施放，或點擊手動施放。</p></div>';
  const grid=document.createElement('div');grid.className='system-grid';
  for(const [id,meta]of Object.entries(EXT_SKILLS)){const s=SKILLS[id],r=ext().skillRanks[id]||0,cost=learnCost(id),card=document.createElement('article');card.className='system-card';
   card.innerHTML=`<span class="bear-tag">${s.type==='Physical'?'物理':s.type==='Heal'?'治療':'法術'} · ${s.target==='Area'?'全體':s.target==='Self'?'自身':'單體'}</span><h3>${s.name} <small>Lv.${r} / 10</small></h3><p>${meta.desc}</p><div class="bear-muted">需求角色 Lv.${meta.level} · MP ${s.cost} · CD ${s.cooldown}秒<br>效果倍率 ×${effectiveSkill(id).multiplier.toFixed(2)}<br>${r>=10?'已達滿級':`研習消耗 ${fmt(cost.gold)} 金幣、${cost.skillPoints} 技能點`}</div>`;
   card.append(button(r>=10?'已達滿級':r?'提升技能':'學習技能',()=>trainSkill(id),r>=10||player.level<meta.level||!afford(cost),'primary'));
   if(r){const label=document.createElement('label');label.className='auto-label';const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!player.autoSkills[id];cb.onchange=()=>{player.autoSkills[id]=cb.checked;changed();};label.append(cb,' 自動施放');card.append(label,button('手動施放',()=>manualSkill(id),player.isDefeated||player.currentMP<s.cost||(skillCooldowns[id]||0)>0));}grid.append(card);
  }
  for(const [id,p]of Object.entries(PASSIVES)){const r=ext().passives[id],cost={gold:(r+1)*200,skillPoints:2},card=document.createElement('article');card.className='system-card passive';card.innerHTML=`<span class="bear-tag">永久被動</span><h3>${p.name} <small>Lv.${r} / 10</small></h3><p>${p.desc}</p><div class="bear-muted">${r>=10?'已達滿級':`${fmt(cost.gold)} 金幣、2 技能點`}</div>`;card.append(button('研習被動',()=>trainPassive(id),r>=10||!afford(cost),'primary'));grid.append(card);}content.append(grid);
 }else if(activeSystem==='guild'){
  refreshShop();const rank=guildRank();content.innerHTML=`<div class="system-intro"><h2>熊寶商會 <span class="bear-tag">Lv.${rank}</span></h2><p>商會聲望 ${fmt(ext().guildXP)} ${rank<10?`/ ${rank*200}`:'· 已達最高等級'} · 商品折扣 ${(rank-1)*2}%<br>商品每 5 分鐘免費更新；提前更新需 100 金幣。購物與販售可累積聲望。</p></div>`;
  const controls=document.createElement('div');controls.className='bear-actions';controls.append(button('立即更新商品 · 100 金',()=>refreshShop(true),ext().gold<100),button('捐獻 200 金 · 聲望 +40',donateGuild,ext().gold<200||rank>=10));content.append(controls);
  const supplies=document.createElement('div');supplies.className='supply-strip';
  for(const [kind,label,price]of [['dust','10 強化粉塵',160],['crystal','1 位階結晶',350],['sp','2 技能點',500]])supplies.append(button(`${label} · ${fmt(shopPrice(price))} 金`,()=>buySupply(kind),ext().gold<shopPrice(price)));
  content.append(supplies);const grid=document.createElement('div');grid.className='system-grid';
  ext().offers.forEach((o,idx)=>{const card=document.createElement('article');card.className='system-card';card.innerHTML=`<span class="bear-tag">${EQUIPMENT_SLOTS[o.item.slot]}</span><h3 class="${TIER_CONFIG[o.item.tier].color}">${esc(o.item.name)}</h3><p>${esc(itemInfo(o.item))}</p><div class="bear-muted">${esc(statsText(o.item))}</div>`;card.append(button(o.sold?'本期已售出':`購買 · ${fmt(shopPrice(o.price))} 金`,()=>buyOffer(idx),o.sold||ext().gold<shopPrice(o.price),'primary'));grid.append(card);});content.append(grid);
  const h=document.createElement('h3');h.textContent='商會委託 · 可重複累積完成';content.append(h);
  for(const m of MISSIONS){const d=missionData(m),card=document.createElement('div');card.className='mission-row';card.innerHTML=`<span><strong>${m.name}</strong><small>${fmt(Math.min(d.current,d.target))} / ${fmt(d.target)} · 累積${m.key==='kills'?'擊殺':m.key==='sold'?'販售':'分解'}<br>獎勵 ${fmt(d.gold)} 金幣、60 聲望、1 技能點</small></span>`;card.append(button('領取獎勵',()=>claimMission(m.id),d.current<d.target));content.append(card);}
 }else{
 content.innerHTML=`<div class="system-intro"><h2>冒險手冊</h2><p>熊寶與夥伴即時戰鬥，擊敗怪物賺取經驗、金幣與裝備。</p></div><div class="help-copy"><h3>裝備成長</h3><p>裝備等級決定穿戴需求與掉落基礎數值，可消耗金幣與粉塵提升等級，最高不超過熊寶的角色等級；提升後各項正值基礎屬性依等級比例成長，至少增加 1 點。位階為 T0 普通 → T1 優良 → T2 稀有 → T3 史詩 → T4 傳說 → T5 神話。裝備可使用金幣、粉塵與結晶升階，每次基礎屬性 +25%。強化最高 +20，每次消耗金幣與粉塵，必定成功，每級提供基礎屬性 +10%。</p><h3>分解與販售</h3><p>分解可得強化粉塵，T3 以上另得位階結晶；販售可得金幣。先選背包篩選，再設定批次最高位階。一鍵操作涵蓋所有分頁，穿戴中及鎖定裝備不會被處理，預設也保護已強化裝備。確認視窗會列出件數及收益。</p><h3>招募與商會</h3><p>招募夥伴後可選擇最多 3 人出戰。培養會提高效果，守護者與商旅的被動僅在出戰時生效。商會販售裝備、粉塵、結晶與技能點；完成累積委託可提升聲望，商會每級提供 2% 折扣，上限 18%。</p><h3>技能與存檔</h3><p>主動技能可升級、自動或手動施放，治癒術在生命低於 50% 時優先自動施放。MP 不足改用普攻。被動技能學習後持續生效。每升級角色可得 5 屬性點、2 技能點與 50 金幣。</p><p>自動存檔開啟時，系統交易後立即存檔，戰鬥進度每 60 秒保存。可在設定匯出／匯入 JSON，將舊版 v19 存檔匯入此版。首次開啟也會尋找同瀏覽器下的舊版存檔。請將 HTML 下載後用瀏覽器開啟；更換瀏覽器、檔案位置或清除瀏覽資料前，先匯出備份。</p></div>`;
 }
 document.getElementById('system-resources').textContent=`金幣 ${fmt(ext().gold)}　粉塵 ${fmt(ext().dust)}　結晶 ${fmt(ext().crystal)}　技能點 ${fmt(ext().skillPoints)}`;
}
let lastLiveSystem=0;
function updateLiveSystem(){// Throttle live changes without replacing focused form controls every combat tick.
 if(Date.now()-lastLiveSystem<4000)return;if(document.activeElement?.closest('#system-content'))return;lastLiveSystem=Date.now();renderSystem();
}
function exportSave(){const data=makeSave();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`熊寶編年史_存檔_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);notify('存檔已匯出，請保留 JSON 備份。');}
function makeSave(){return {schemaVersion:20,player,currentZoneIndex,lastSaveTime:new Date().toISOString(),autoSaveEnabled};}
saveGame=function(quiet=false){try{const data=makeSave();localStorage.setItem(EXT_KEY,JSON.stringify(data));lastSaveTime=data.lastSaveTime;document.getElementById('last-save-time').textContent=new Date(lastSaveTime).toLocaleString('zh-TW');if(quiet!==true)notify('遊戲進度已保存。');return true;}catch(e){notify('此瀏覽器無法儲存，請使用「匯出存檔」備份。');return false;}};
function validateSave(data){if(!data||!data.player||!Number.isFinite(data.player.level)||data.player.level<1||data.player.level>10000||!Array.isArray(data.player.inventory))throw Error('invalid');
 for(const key of ['allocatedSTR','allocatedINT','allocatedCON','allocatedAGI','StatPoints','exp']){if(data.player[key]!==undefined&&(!Number.isFinite(data.player[key])||data.player[key]<0))throw Error('invalid');}return data;
}
function applySave(data){
 validateSave(data);const previous={player,currentZoneIndex,autoSaveEnabled,lastSaveTime};
 try{player={...initializePlayerObject(),...data.player};currentZoneIndex=nint(data.currentZoneIndex,0,MAX_ZONES-1);autoSaveEnabled=data.autoSaveEnabled!==false;lastSaveTime=data.lastSaveTime;initializeGame();document.getElementById('last-save-time').textContent=lastSaveTime?new Date(lastSaveTime).toLocaleString('zh-TW'):'尚未保存';}
 catch(error){player=previous.player;currentZoneIndex=previous.currentZoneIndex;autoSaveEnabled=previous.autoSaveEnabled;lastSaveTime=previous.lastSaveTime;if(player.extension)initializeGame();throw error;}
}
loadGame=function(){try{const raw=localStorage.getItem(EXT_KEY)||localStorage.getItem(STORAGE_KEY);if(!raw)return false;applySave(JSON.parse(raw));logCombat('📂 已讀取冒險進度，並套用新版系統。','log-status');return true;}catch(e){logCombat('📂 無法讀取本機存檔；可在設定匯入 JSON 備份。','log-status');return false;}};
deleteSave=function(){if(!confirm('確定重置熊寶 v20 的所有進度？建議先匯出存檔。原版 v19 存檔會保留。'))return;try{localStorage.removeItem(EXT_KEY);}catch(e){}player=initializePlayerObject();currentZoneIndex=0;autoSaveEnabled=true;initializeGame();saveGame(true);changed('已建立新的熊寶冒險。');};
function importSave(file){if(!file)return;if(file.size>30*1024*1024){notify('存檔過大，請選擇 30MB 以下的 JSON。');return;}
 const reader=new FileReader();reader.onload=()=>{let previous;try{const data=validateSave(JSON.parse(reader.result));if(!confirm('匯入將取代目前進度，是否繼續？'))return;previous=JSON.parse(JSON.stringify(makeSave()));applySave(data);saveGame(true);changed('存檔匯入成功。');}catch(e){if(previous)applySave(previous);notify('匯入失敗，請確認為有效的熊寶／虛空編年史存檔。');}};reader.readAsText(file);
}
document.addEventListener('DOMContentLoaded',()=>{
 document.getElementById('edit-name-btn').hidden=true;
 document.querySelectorAll('[data-system]').forEach(b=>b.onclick=()=>openSystem(b.dataset.system));
 document.getElementById('batch-sell-button').onclick=()=>processItems('sell',batchCandidates().map(i=>i.id));
 document.getElementById('batch-tier').onchange=renderInventory;document.getElementById('protect-enhanced').onchange=renderInventory;
 document.getElementById('pause-button').onclick=()=>{ext().paused=!ext().paused;updatePlayerUI();if(autoSaveEnabled)saveGame(true);};
 document.getElementById('export-save').onclick=exportSave;document.getElementById('import-save').onchange=e=>{importSave(e.target.files[0]);e.target.value='';};
 document.getElementById('systemsModal').addEventListener('click',e=>{if(e.target===e.currentTarget&&e.currentTarget.classList.contains('modal'))e.currentTarget.style.display='none';});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal').forEach(m=>m.style.display='none');});
 document.getElementById('inventory-filter').addEventListener('change',renderInventory);
 document.getElementById('auto-save-checkbox').addEventListener('change',()=>{if(autoSaveEnabled)saveGame(true);});
 window.addEventListener('pagehide',()=>{if(autoSaveEnabled)saveGame(true);});
 renderSkills();renderWallet();renderSystem();
});

