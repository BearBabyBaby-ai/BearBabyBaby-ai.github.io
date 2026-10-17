const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const app=require('./dom.cjs');
const state=fs.readFileSync(path.join(__dirname,'fixtures/v21-state.json'),'utf8');
const before=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/v21-combat.json'),'utf8'));
const after=JSON.parse(app.run(`(()=>{let seed=813579;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};applySave(JSON.parse(${JSON.stringify(state)}));ext().paused=false;const frames=[];for(let i=0;i<100;i++){gameLoop();regenLoop();frames.push({hp:player.currentHP,mp:player.currentMP,level:player.level,exp:player.exp,stats:[player.PATK,player.MATK,player.PDEF,player.MDEF,player.maxHP,player.maxMP,player.PDR,player.MDR],kills:ext().kills,gold:ext().gold,ore:ext().ore,cooldowns:{...skillCooldowns},enemies:monsters.map(m=>({name:m.name,hp:m.currentHP,max:m.maxHP,atk:m.PATK,cd:m.attackCooldown})),drops:player.inventory.map(i=>({slot:i.slot,tier:i.tier,level:i.minLevel,stats:i.baseStats}))});}return JSON.stringify(frames);})()`));
for(const frame of after)for(const key of Object.keys(frame.cooldowns))if(!(key in before[0].cooldowns))delete frame.cooldowns[key];
for(let i=0;i<100;i++)assert.deepEqual(after[i],before[i],`combat frame ${i+1} changed`);
console.log('PASS 100 combat ticks match the v21 baseline');
