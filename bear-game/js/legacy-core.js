
        // --- JavaScript 戰鬥邏輯 V6.6.8 (修正技能施放優先度) ---

        // 1. 遊戲參數與數據
        const TICK_RATE_MS = 1000;
        const PLAYER_ATK_INTERVAL = 1000;
        const REGEN_RATE_MS = 1000; 
        const DEFEAT_COOLDOWN_SECONDS = 5; 
        const AUTOSAVE_INTERVAL_MS = 60000; 
        const STORAGE_KEY = 'VoidChronicleSave';
        
        const MAX_INVENTORY_MULTIPLIER = 500; // 每級增加 500 個物品欄位
        
        // V6.6.7 核心修正：提升基礎掉落率至 10%
        const BASE_DROP_CHANCE = 0.10; 
        
        const REGULAR_MONSTER_MULTIPLIER = 0.7; 
        const MAX_ZONE_LEVEL = 10000; // 最大等級
        const ZONE_LEVEL_STEP = 10; // 每階 10 級
        const MAX_ZONES = MAX_ZONE_LEVEL / ZONE_LEVEL_STEP; 

        // 新增: 物品欄分頁設定
        let inventoryCurrentPage = 1;
        const INVENTORY_ITEMS_PER_PAGE = 30; // 每頁 30 件
        
        let nameEditable = true; 
        let autoSaveEnabled = true; 
        let autoSaveTimer = null;
        let gameLoopInterval = null;
        let regenLoopInterval = null;
        let inventoryFilter = 'ALL'; 
        
        // 特殊怪物配置
        const SPECIAL_MONSTER_CONFIG = [
            { prefix: "[BOSS]", multiplier: 3.00, expBonus: 5.0, chance: 0.01, isSpecial: true },
            { prefix: "[首領]", multiplier: 2.00, expBonus: 3.0, chance: 0.04, isSpecial: true },
            { prefix: "[菁英]", multiplier: 1.50, expBonus: 1.5, chance: 0.10, isSpecial: true }
        ];
        
        // --- 怪物詞綴庫 (V6.6.2) ---
        const MONSTER_PREFIXES = [
            "狂暴的", "古代的", "墮落的", "發光的", "暗影", "腐爛的", "冰霜", "烈焰", 
            "致命的", "靈巧的", "巨大", "微小", "沉睡的", "被詛咒的", "虛空", "失落的",
            "精銳", "強化", "變異", "閃耀", "深淵", "傳奇", "獨眼", "石化"
        ];
        const MONSTER_CORES = [
            "哥布林", "骸骨", "巨蟒", "元素", "幽魂", "狼人", "蜘蛛", "蝙蝠",
            "史萊姆", "食人魔", "地精", "穴居人", "魔像", "鷹身女妖", "甲蟲", "龍蜥",
            "熊", "精靈", "惡魔", "守衛", "戰士", "法師", "盜賊", "祭司"
        ];
        const MONSTER_SUFFIXES = [
            "守衛者", "沼澤之子", "深淵領主", "看門狗", "殘兵", "斥候", "統治者", "吞噬者",
            "之王", "先驅者", "幻影", "潛伏者", "破壞者", "創造者", "審判官", "觀察者",
            "的化身", "的爪牙", "的僕從", "的碎片", "的使者", "的餘燼", "的風暴", "的意志"
        ];
        // --- 怪物詞綴擴充結束 ---

        // 基礎素質點
        const BASE_STR = 10;
        const BASE_INT = 10;
        const BASE_CON = 10;
        const BASE_AGI = 10;
        const BASE_LUK = 0; 
        const BASE_SPL = 0; 
        
        // 裝備部位定義
        const EQUIPMENT_SLOTS = {
            WEAPON: "武器", SHIELD: "盾牌/副手", HELM: "頭盔", 
            CHEST: "胸甲", GLOVES: "手套", BOOTS: "靴子", 
            NECK: "項鍊", RING1: "戒指(一)", RING2: "戒指(二)"
        };
        
        // 裝備品階定義
        const TIER_CONFIG = {
            "T0": { color: "log-item-t0", chance: 0.35, minStat: 0, maxStat: 0, display: "普通" },
            "T1": { color: "log-item-t1", chance: 0.30, minStat: 1, maxStat: 5, display: "優良" },
            "T2": { color: "log-item-t2", chance: 0.20, minStat: 5, maxStat: 15, display: "稀有" },
            "T3": { color: "log-item-t3", chance: 0.10, minStat: 10, maxStat: 30, display: "史詩" },
            "T4": { color: "log-item-t4", chance: 0.04, minStat: 20, maxStat: 50, display: "傳說" },
            "T5": { color: "log-item-t5", chance: 0.01, minStat: 40, maxStat: 100, display: "神話" }
        };
        const TIER_ORDER = ["T5", "T4", "T3", "T2", "T1", "T0"];
        const STAT_KEYS = ["STR", "INT", "CON", "AGI", "LUK", "SPL", "PATK", "MATK", "PDEF", "MDEF", "MaxHP", "MaxMP", "Pcrit", "Mcrit"];

        // 玩家基礎屬性與衍生公式
        let player = initializePlayerObject();
        let skillCooldowns = {};
        let monsters = [];
        let currentZoneIndex = 0; 
        let lastSaveTime = null;

        // 動態生成區域設定 (0-1000 級, 每 10 級一階)
        function generateZoneConfigs() {
            const names = [
                "新手", "低語", "沉寂", "幽暗", "被遺忘", "詛咒", "遠古", "魔域", "虛空", "終焉"
            ];
            const types = [
                "草原", "森林", "礦洞", "神殿", "沼澤", "廢墟", "祭壇", "深淵", "邊界", "裂隙"
            ];
            const configs = [];
            for (let i = 0; i < MAX_ZONES; i++) {
                const minLevel = i * ZONE_LEVEL_STEP + 1;
                const maxLevel = (i + 1) * ZONE_LEVEL_STEP;
                // 動態組合名稱
                const name1 = names[Math.floor(i / 10) % names.length];
                const name2 = types[i % types.length];
                const zoneName = `${name1}${name2} (Lv${minLevel}-${maxLevel})`;
                configs.push({ name: zoneName, minLevel: minLevel, maxLevel: maxLevel });
            }
            return configs;
        }
        const ZONE_CONFIGS = generateZoneConfigs();

        // 技能配置
        // V6.6.6: 移除所有 'desc' 欄位，並保持冷卻時間為 0。
        const SKILLS = {
            basic_attack: { name: "普通攻擊", cost: 0, type: 'Physical', target: 'Single', multiplier: 1.0, isAuto: false, cooldown: 0 },
            heavy_hit: { name: "重擊", cost: 10, type: 'Physical', target: 'Single', multiplier: 1.5, isAuto: true, cooldown: 0 }, 
            blizzard: { name: "冰雪暴", cost: 30, type: 'Magic', target: 'Area', multiplier: 1.2, isAuto: true, cooldown: 0 }, 
            meteor: { name: "隕石術", cost: 40, type: 'Magic', target: 'Area', multiplier: 2.0, isAuto: true, cooldown: 0 }, 
            heal: { name: "治癒術", cost: 20, type: 'Heal', target: 'Self', multiplier: 2.5, isAuto: true, cooldown: 0 } 
        };
        
        // --- 初始化邏輯 ---
        function initializePlayerObject() {
            return {
                name: '熊寶',
                level: 1,
                exp: 0,
                expToNext: 100,
                StatPoints: 0,
                allocatedSTR: 0,
                allocatedINT: 0,
                allocatedCON: 0,
                allocatedAGI: 0,
                STR: BASE_STR,
                INT: BASE_INT,
                CON: BASE_CON,
                AGI: BASE_AGI,
                LUK: BASE_LUK,
                SPL: BASE_SPL,
                currentHP: 100,
                maxHP: 100,
                currentMP: 50,
                maxMP: 50,
                HPRegen: 1.0,
                MPRegen: 1.0,
                PATK: 10,
                MATK: 5,
                PDEF: 0,
                MDEF: 0,
                PCrit: 0,
                MCrit: 0,
                PDR: 0,
                MDR: 0,
                attackCooldown: 0,
                isDefeated: false,
                equipment: {},
                inventory: [],
                autoSkills: { heavy_hit: true, blizzard: true, heal: true, meteor: false }
            };
        }
        
        function initializeGame() {
            // 確保所有裝備欄位初始化
            for (const slotId in EQUIPMENT_SLOTS) {
                if (!player.equipment[slotId]) {
                    player.equipment[slotId] = null;
                }
            }
            
            // 確保所有技能冷卻初始化
            for (const id in SKILLS) {
                 skillCooldowns[id] = 0;
            }

            // 初次計算屬性
            calculateStats(); 
            // 設置最大值
            player.currentHP = player.maxHP;
            player.currentMP = player.maxMP;

            // 啟動主循環
            gameLoopInterval = setInterval(gameLoop, TICK_RATE_MS);
            regenLoopInterval = setInterval(regenLoop, REGEN_RATE_MS);
            
            // 啟用自動存檔
            document.getElementById('auto-save-checkbox').checked = autoSaveEnabled;
            if (autoSaveEnabled) {
                autoSaveTimer = setInterval(saveGame, AUTOSAVE_INTERVAL_MS);
            }

            // 首次生成怪物群
            spawnMonster();
            
            // 更新UI
            updatePlayerUI();
            renderZoneUI();
            renderSkills();
        }

        // --- 核心戰鬥循環 ---
        function gameLoop() {
            if (player.isDefeated) {
                handleDefeatCooldown();
                return;
            }
            
            // 處理技能冷卻
            for (const id in skillCooldowns) {
                if (skillCooldowns[id] > 0) {
                    skillCooldowns[id]--;
                }
            }

            // --- 技能施放與普攻判定 ---
            const targets = monsters.filter(m => m.currentHP > 0);
            
            if (targets.length > 0) {
                const target = targets[0]; 
                
                // 1. 嘗試施放非普攻技能 (治療或攻擊)
                const skillUsed = performAutoSkills(target); 
                
                // 2. 如果沒有施放主動技能，則進行普攻判定
                if (!skillUsed) {
                    if (player.attackCooldown === 0) {
                        useSkill(SKILLS.basic_attack, target, 'basic_attack');
                        // 重新設置普通攻擊冷卻
                        player.attackCooldown = PLAYER_ATK_INTERVAL / TICK_RATE_MS;
                    }
                }
            }
            
            // 減少普攻冷卻計數
            if (player.attackCooldown > 0) {
                player.attackCooldown--;
            }
            // --- 技能施放與普攻判定結束 ---
            
            // 怪物攻擊 (只鎖定第一隻活著的怪物)
            const activeMonsters = monsters.filter(m => m.currentHP > 0);
            activeMonsters.forEach(monster => {
                monsterAttack(monster);
            });
            
            // 檢查玩家狀態
            if (player.currentHP <= 0) {
                playerDefeat();
            }
        }

        // --- 數值計算函數 ---
        function calculateStats() {
            // 基礎素質點 (初始值 + 分配點數)
            let baseSTR = BASE_STR + player.allocatedSTR;
            let baseINT = BASE_INT + player.allocatedINT;
            let baseCON = BASE_CON + player.allocatedCON;
            let baseAGI = BASE_AGI + player.allocatedAGI;
            
            // LUK 和 SPL 只保留基礎值
            let baseLUK = BASE_LUK;
            let baseSPL = BASE_SPL;

            // 裝備加成總和
            let equipmentBonus = {};
            for (const key of STAT_KEYS) {
                equipmentBonus[key] = 0;
            }
            for (const slot in player.equipment) {
                const item = player.equipment[slot];
                if (item && item.stats) {
                    for (const stat in getItemStats(item)) {
                        if (equipmentBonus[stat] !== undefined) {
                            equipmentBonus[stat] += getItemStats(item)[stat];
                        }
                    }
                }
            }

            // 最終基礎屬性 (基礎 + 裝備)
            player.STR = baseSTR + (equipmentBonus.STR || 0);
            player.INT = baseINT + (equipmentBonus.INT || 0);
            player.CON = baseCON + (equipmentBonus.CON || 0);
            player.AGI = baseAGI + (equipmentBonus.AGI || 0);
            player.LUK = baseLUK + (equipmentBonus.LUK || 0);
            player.SPL = baseSPL + (equipmentBonus.SPL || 0);
            
            // 經驗與點數
            player.expToNext = 100 + player.level * 50; 
            
            // 衍生屬性計算
            // Max HP: (100 + CON * 15) + (裝備 MaxHP) * (1 + 0.05 * CON) 
            let con_multiplier = 1 + 0.05 * player.CON;
            player.maxHP = Math.floor((100 + player.CON * 15) + (equipmentBonus.MaxHP || 0) * con_multiplier);
            
            // Max MP: (50 + INT * 10) + (裝備 MaxMP) * (1 + 0.05 * INT)
            let int_multiplier = 1 + 0.05 * player.INT;
            player.maxMP = Math.floor((50 + player.INT * 10) + (equipmentBonus.MaxMP || 0) * int_multiplier);
            
            // ATK/DEF (基礎 + 素質加成 + 裝備)
            player.PATK = Math.floor((10 + player.STR * 2) + (equipmentBonus.PATK || 0));
            player.MATK = Math.floor((5 + player.INT * 2.5) + (equipmentBonus.MATK || 0));
            player.PDEF = Math.floor((player.CON + player.AGI / 2) + (equipmentBonus.PDEF || 0));
            player.MDEF = Math.floor((player.INT / 2 + player.CON) + (equipmentBonus.MDEF || 0));

            // 恢復
            player.HPRegen = 1.0 + player.CON * 0.5;
            player.MPRegen = 1.0 + player.INT * 0.5;

            // 爆擊率 (基礎 5% + AGI 加成 + LUK 加成 + 裝備加成)
            player.PCrit = Math.min(95, (5 + player.AGI * 0.1 + player.LUK * 0.05) + (equipmentBonus.Pcrit || 0));
            player.MCrit = Math.min(95, (5 + player.INT * 0.1 + player.LUK * 0.05) + (equipmentBonus.Mcrit || 0));

            // 減傷率 (以防禦力計算)
            player.PDR = Math.min(90, Math.floor(player.PDEF * 0.5)); // 物理減傷，上限 90%
            player.MDR = Math.min(90, Math.floor(player.MDEF * 0.5)); // 法術減傷，上限 90%

            // 調整當前生命/魔力以避免超出最大值
            player.currentHP = Math.min(player.currentHP, player.maxHP);
            player.currentMP = Math.min(player.currentMP, player.maxMP);
        }

        // --- UI 更新函數 ---
        function updatePlayerUI() {
            document.getElementById('player-level').textContent = player.level;
            document.getElementById('player-name-display').textContent = player.name;
            
            document.getElementById('player-hp').textContent = formatNumber(player.currentHP);
            document.getElementById('player-max-hp').textContent = formatNumber(player.maxHP);
            document.getElementById('player-hp-bar').value = player.currentHP;
            document.getElementById('player-hp-bar').max = player.maxHP;
            document.getElementById('player-hpregen').textContent = player.HPRegen.toFixed(1);
            
            document.getElementById('player-mp').textContent = formatNumber(player.currentMP);
            document.getElementById('player-max-mp').textContent = formatNumber(player.maxMP);
            document.getElementById('player-mp-bar').value = player.currentMP;
            document.getElementById('player-mp-bar').max = player.maxMP;
            document.getElementById('player-mpregen').textContent = player.MPRegen.toFixed(1);

            document.getElementById('player-exp').textContent = formatNumber(player.exp);
            document.getElementById('player-exp-to-next').textContent = formatNumber(player.expToNext);
            document.getElementById('player-exp-bar').value = player.exp;
            document.getElementById('player-exp-bar').max = player.expToNext;
            
            document.getElementById('player-patk').textContent = formatNumber(player.PATK);
            document.getElementById('player-matk').textContent = formatNumber(player.MATK);
            document.getElementById('player-pdef').textContent = formatNumber(player.PDEF);
            document.getElementById('player-mdef').textContent = formatNumber(player.MDEF);

            document.getElementById('player-str').textContent = formatNumber(player.STR);
            document.getElementById('player-int').textContent = formatNumber(player.INT);
            document.getElementById('player-con').textContent = formatNumber(player.CON);
            document.getElementById('player-agi').textContent = formatNumber(player.AGI);
            document.getElementById('player-luk').textContent = formatNumber(player.LUK);
            document.getElementById('player-spl').textContent = formatNumber(player.SPL);
            
            document.getElementById('player-phys-crit').textContent = player.PCrit.toFixed(2);
            document.getElementById('player-magic-crit').textContent = player.MCrit.toFixed(2);
            document.getElementById('player-pdr-display').textContent = player.PDR.toFixed(0);
            document.getElementById('player-mdr-display').textContent = player.MDR.toFixed(0);

            // 戰鬥狀態更新
            let statusText = player.isDefeated ? "❌ 戰敗冷卻中" : (monsters.length > 0 && monsters.filter(m => m.currentHP > 0).length > 0) ? "⚔️ 戰鬥中" : "🛌 待機中";
            document.getElementById('cooldown-status').innerHTML = statusText;

            // 模態框內的素質顯示
            document.getElementById('stat-points-remaining').textContent = player.StatPoints;
            document.getElementById('stat-str-modal').textContent = player.allocatedSTR;
            document.getElementById('stat-int-modal').textContent = player.allocatedINT;
            document.getElementById('stat-con-modal').textContent = player.allocatedCON;
            document.getElementById('stat-agi-modal').textContent = player.allocatedAGI;
            document.getElementById('stat-luk-modal').textContent = player.LUK;
            document.getElementById('stat-spl-modal').textContent = player.SPL;
            
            // 根據點數顯示/隱藏按鈕
            const addBtns = document.querySelectorAll('.add-point-btn');
            addBtns.forEach(btn => {
                const amount = parseInt(btn.dataset.amount);
                btn.disabled = player.StatPoints < amount;
            });
            
            renderEquipmentSlots();
            renderEquipmentBonusSummary();
        }

        // V6.6.6: 移除 renderSkills 中所有對 desc 的引用。
        function renderSkills() {
            const skillArea = document.getElementById('skill-area');
            skillArea.innerHTML = '';
            
            for (const id in SKILLS) {
                const skill = SKILLS[id];
                if (id === 'basic_attack') {
                    // 普攻獨立顯示
                    const p = document.createElement('div');
                    p.className = 'skill-item';
                    p.innerHTML = `🔪 ${skill.name} (單體, MP: ${skill.cost})`;
                    skillArea.appendChild(p);
                } else if (skill.isAuto) {
                    // 主動技能
                    const div = document.createElement('div');
                    div.className = 'skill-item';
                    
                    const label = document.createElement('label');
                    
                    const cooldownText = skill.cooldown > 0 ? `(CD: ${skill.cooldown}s)` : `(CD: 無)`;
                    
                    label.innerHTML = `
                        <span style="display: flex; flex-direction: column; text-align: left;">
                            <strong>${skill.name}</strong> 
                            <span style="font-size: 0.8em; color: #3498db;">MP: ${skill.cost} ${cooldownText}</span>
                        </span>
                    `;

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = player.autoSkills[id] || false;
                    checkbox.dataset.skillId = id;
                    checkbox.addEventListener('change', handleSkillToggle);

                    label.appendChild(checkbox);
                    div.appendChild(label);
                    skillArea.appendChild(div);
                }
            }
        }
        
        function updateMonsterUI() {
            const monsterListDiv = document.getElementById('monster-list');
            monsterListDiv.innerHTML = '';
            
            // 重新計算怪物數量
            const activeMonsters = monsters.filter(m => m.currentHP > 0);
            document.getElementById('monster-count').textContent = activeMonsters.length;
            document.getElementById('monster-max-count').textContent = monsters.length;

            if (activeMonsters.length === 0) {
                monsterListDiv.innerHTML = `<p style="text-align: center; color: #7f8c8d;">區域內沒有活著的怪物了。</p>`;
                return;
            }

            activeMonsters.forEach(monster => {
                const card = document.createElement('div');
                card.className = 'monster-card';
                card.id = `monster-${monster.id}`;

                let hpPercent = (monster.currentHP / monster.maxHP) * 100;
                hpPercent = Math.max(0, hpPercent); // 確保不會有負值

                card.innerHTML = `
                    <h4>${monster.name} [Lv.${monster.level}]</h4>
                    <p style="margin: 1px 0; font-size: 0.9em;">HP: ${formatNumber(monster.currentHP)} / ${formatNumber(monster.maxHP)}</p>
                    <progress class="monster-hp-bar" value="${monster.currentHP}" max="${monster.maxHP}"></progress>
                    <div class="monster-stats-grid">
                        <div>物攻: ${formatNumber(monster.PATK)}</div>
                        <div>法攻: ${formatNumber(monster.MATK)}</div>
                        <div>物防: ${formatNumber(monster.PDEF)}</div>
                        <div>法防: ${formatNumber(monster.MDEF)}</div>
                    </div>
                `;
                monsterListDiv.appendChild(card);
            });
        }
        
        function renderZoneUI() {
            const currentZone = ZONE_CONFIGS[currentZoneIndex];
            document.getElementById('current-zone-name').textContent = currentZone.name;
            document.getElementById('zone-min-lvl').textContent = currentZone.minLevel;
            document.getElementById('zone-max-lvl').textContent = currentZone.maxLevel;
            
            document.getElementById('prev-zone').disabled = currentZoneIndex === 0;
            document.getElementById('next-zone').disabled = currentZoneIndex >= ZONE_CONFIGS.length - 1;
        }

        function renderInventory() {
            const inventoryList = document.getElementById('inventory-list');
            inventoryList.innerHTML = '';
            
            const filteredInventory = player.inventory.filter(item => {
                return inventoryFilter === 'ALL' || item.tier === inventoryFilter;
            });
            
            const totalItems = filteredInventory.length;
            const totalPages = Math.ceil(totalItems / INVENTORY_ITEMS_PER_PAGE);
            
            inventoryCurrentPage = Math.max(1, Math.min(inventoryCurrentPage, totalPages || 1));
            
            const startIndex = (inventoryCurrentPage - 1) * INVENTORY_ITEMS_PER_PAGE;
            const endIndex = startIndex + INVENTORY_ITEMS_PER_PAGE;
            const itemsToShow = filteredInventory.slice(startIndex, endIndex);

            document.getElementById('inventory-count').textContent = totalItems;
            document.getElementById('inventory-max').textContent = formatNumber(player.level * MAX_INVENTORY_MULTIPLIER);
            document.getElementById('page-info').textContent = `第 ${inventoryCurrentPage} / ${totalPages || 1} 頁 (顯示 ${itemsToShow.length} 項目)`;

            document.getElementById('prev-page-btn').disabled = inventoryCurrentPage === 1;
            document.getElementById('next-page-btn').disabled = inventoryCurrentPage === totalPages || totalPages === 0;
            
            if (totalItems === 0) {
                 inventoryList.innerHTML = `<p style="text-align: center; color: #7f8c8d;">物品欄內沒有項目。</p>`;
            }


            itemsToShow.forEach((item, index) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'inventory-item';
                
                const span = document.createElement('span');
                span.innerHTML = `<span class="${TIER_CONFIG[item.tier].color}">${item.name}</span> <span style="color:#999; font-size: 0.8em;">(Lv${item.minLevel})</span>`;
                span.setAttribute('title', item.name); // 設置基礎 title
                
                // 添加 Tooltip
                const tooltip = createItemTooltip(item);
                span.style.position = 'relative'; // 為 tooltip 定位
                span.appendChild(tooltip);

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'inventory-actions';
                
                const equipBtn = document.createElement('button');
                equipBtn.className = 'equip-btn';
                equipBtn.textContent = '裝備';
                equipBtn.onclick = () => { equipItem(item); };
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.textContent = '刪除';
                deleteBtn.onclick = () => { deleteItem(item.id); };

                actionsDiv.appendChild(equipBtn);
                actionsDiv.appendChild(deleteBtn);

                itemDiv.appendChild(span);
                itemDiv.appendChild(actionsDiv);
                inventoryList.appendChild(itemDiv);
            });
        }

        // --- 核心戰鬥函數 ---
        
        // V6.6.8: 修改技能優先度，攻擊技能優先於治癒術
        function performAutoSkills(target, isAttempt = false) {
            
            const activeMonsters = monsters.filter(m => m.currentHP > 0);
            
            // 1. 攻擊技能 (優先執行攻擊)
            for (const skillId in player.autoSkills) {
                // 排除普攻和治癒術
                if (skillId === 'basic_attack' || skillId === 'heal') continue;

                const skill = SKILLS[skillId];
                if (player.autoSkills[skillId] && player.currentMP >= skill.cost && skillCooldowns[skillId] === 0) {
                    if (!isAttempt) {
                         // 確保目標存在
                         const actualTarget = skill.target === 'Area' ? activeMonsters : target;
                         if (actualTarget.length === 0) continue; 
                         
                         // 成功施放攻擊技能，返回 true
                         useSkill(skill, actualTarget, skillId);
                    }
                    return true; // 每個 TICK 只施放一個主動技能
                }
            }
            
            // 2. 治癒術 (HP 低於 50% 時才作為備用技能施放)
            const healSkill = SKILLS.heal;
            const healId = 'heal';
            if (player.autoSkills[healId] && player.currentMP >= healSkill.cost && skillCooldowns[healId] === 0) {
                // 治癒術施放條件：HP 低於 50%
                if ((player.currentHP / player.maxHP) < 0.5) {
                    if (!isAttempt) {
                        // 成功施放治癒術，返回 true
                        useSkill(healSkill, null, healId); 
                    }
                    return true; 
                }
            }

            return false;
        }

        // V6.6.6: 修復 useSkill 邏輯，移除 '總傷'，並確保 AoE 技能紀錄所有怪物的傷害數值。
        function useSkill(skill, target, skillId) {
            
            // 普攻不需要 MP 檢查
            if (skillId !== 'basic_attack' && player.currentMP < skill.cost) {
                return false;
            }
            
            // 扣除魔力
            if (skillId !== 'basic_attack') {
                 player.currentMP -= skill.cost;
            }
            
            // 應用冷卻 (即使冷卻是 0，也會設為 0)
            if (skill.cooldown > 0) {
                // 轉換為 TICK 單位 (1000ms / 1000ms = 1)
                skillCooldowns[skillId] = skill.cooldown * (1000 / TICK_RATE_MS); 
            } else {
                 skillCooldowns[skillId] = 0; // 核心還原：如果是 0，就設為 0
            }

            const isPlayerTurn = true;
            let logClass = skill.type === 'Physical' ? 'log-skill-phys' : (skill.type === 'Magic' ? 'log-skill-magic' : 'log-heal');


            if (skill.type === 'Heal') {
                // 治癒術
                const baseHeal = player.MATK * skill.multiplier;
                const finalHeal = Math.floor(baseHeal * (1 + Math.random() * 0.1));
                
                player.currentHP = Math.min(player.maxHP, player.currentHP + finalHeal);
                logCombat(`<span class='log-name'>${player.name}</span> 施放 <span class='log-skill-magic'>${skill.name}</span>，恢復自身 <span class='log-heal'>${formatNumber(finalHeal)}</span> 點生命！`, 'log-heal');

            } else {
                // 攻擊技能 (物理/魔法)
                const targets = Array.isArray(target) ? target : [target];
                
                if (targets.length > 0) {
                     // 紀錄施放動作 (單體或範圍)
                     logCombat(`<span class='log-name'>${player.name}</span> 施放 <span class='${logClass}'>${skill.name}</span>!`, logClass);
                } else if (targets.length === 0) {
                     logCombat(`<span class='log-name'>${player.name}</span> 嘗試施放 ${skill.name}，但找不到目標！`, 'log-status');
                }

                targets.forEach(t => {
                    const { damage, isCrit, damageType } = calculateDamage(skill, t, isPlayerTurn);
                    
                    t.currentHP -= damage;
                    
                    // 戰鬥紀錄: 記錄對每個目標的傷害 (無論是單體還是 AoE，皆在此處紀錄，符合用戶要求)
                    let dmgLog = `<span class='log-name'>${player.name}</span> 對 <span class='log-name'>${t.name}</span> 造成 <span class='log-dmg-value'>${formatNumber(damage)}</span> 點 ${damageType} 傷害`;
                    if (isCrit) {
                        dmgLog += ` <span class='log-crit'>(爆擊!)</span>`;
                    }
                    logCombat(dmgLog, logClass);
                    
                    // 檢查怪物是否死亡
                    if (t.currentHP <= 0) {
                        handleMonsterDefeat(t);
                    }
                });
            }
            
            updatePlayerUI();
            updateMonsterUI();
            return true;
        }

        function calculateDamage(skill, target, isPlayerTurn) {
            let baseDamage = 0;
            let finalDamage = 0;
            let defense = 0;
            let reductionRate = 0;
            let critChance = 0;
            let damageType = '';
            let isCrit = false;

            if (skill.type === 'Physical' || skill.type === 'Basic') {
                baseDamage = player.PATK;
                defense = target.PDEF;
                reductionRate = target.PDR;
                critChance = player.PCrit;
                damageType = `<span class='log-dmg-phys-type'>[物理]</span>`;
            } else if (skill.type === 'Magic') {
                baseDamage = player.MATK;
                defense = target.MDEF;
                reductionRate = target.MDR;
                critChance = player.MCrit;
                damageType = `<span class='log-dmg-magic-type'>[法術]</span>`;
            }

            // 1. 計算基礎傷害 (素質 * 技能倍率)
            let rawDamage = baseDamage * skill.multiplier;

            // 2. 爆擊判定
            if (Math.random() * 100 < critChance) {
                isCrit = true;
                rawDamage *= 1.5; // 爆擊傷害 1.5x
            }

            // 3. 減傷計算
            // 減傷公式：Dmg * (1 - ReductionRate%) 
            // 假設 ReductionRate 為百分比 (如 50 代表 50%)
            let damageAfterReduction = rawDamage * (1 - reductionRate / 100);
            
            // 確保傷害最低為 1
            finalDamage = Math.max(1, Math.floor(damageAfterReduction));

            return { damage: finalDamage, isCrit, damageType };
        }

        // --- 怪物相關函數 ---

        function monsterAttack(monster) {
            if (monster.attackCooldown > 0) {
                monster.attackCooldown--;
                updateMonsterUI();
                return;
            }
            
            // 怪物鎖定玩家
            if (player.currentHP <= 0 || player.isDefeated) {
                return;
            }
            
            const skill = SKILLS.basic_attack; 
            
            // 怪物普攻傷害公式
            let rawDamage = monster.PATK * skill.multiplier; 
            
            // 玩家減傷
            let defense = player.PDEF;
            let reductionRate = player.PDR;
            let damageAfterReduction = rawDamage * (1 - reductionRate / 100);
            
            let finalDamage = Math.max(1, Math.floor(damageAfterReduction));

            player.currentHP -= finalDamage;
            
            // 戰鬥紀錄
            logCombat(`<span class='log-name'>${monster.name}</span> 對 <span class='log-name'>${player.name}</span> 造成 <span class='log-dmg-value'>${formatNumber(finalDamage)}</span> 點傷害!`, 'log-default');

            // 重設怪物攻擊冷卻 (怪物攻擊間隔約 2 秒)
            monster.attackCooldown = 2; // 2 ticks

            updatePlayerUI();
        }
        
        function handleMonsterDefeat(monster) {
            // 處理經驗值
            let expGained = monster.expValue;
            logCombat(`<span class='log-name'>${monster.name}</span> 被擊敗。`, 'log-status');
            
            player.exp += expGained;
            logCombat(`獲得經驗 <span class='log-exp'>${formatNumber(expGained)}</span>。`, 'log-exp');

            // 處理掉寶
            handleItemDrop(monster);

            // 升級檢查
            while (player.exp >= player.expToNext) {
                levelUp();
            }

            // 移除已死亡怪物
            monsters = monsters.filter(m => m.id !== monster.id);
            
            // 檢查是否需要刷新怪物
            if (monsters.length < 1) { 
                spawnMonster();
            }

            updatePlayerUI();
            updateMonsterUI();
        }

        // --- 輔助/通用函數 ---
        function levelUp() {
            player.level++;
            player.exp -= player.expToNext; 
            
            // 根據等級獲得屬性點
            player.StatPoints += 5; // 每級獲得 5 點

            logCombat(`🎉 <span class='log-status'>恭喜! ${player.name} 提升到 Lv.${player.level}！獲得 5 點屬性點。</span>`, 'log-status');
            calculateStats();
        }
        
        function regenLoop() {
            if (player.isDefeated) return;

            // HP 恢復
            const hpRegenAmount = player.HPRegen;
            if (player.currentHP < player.maxHP) {
                player.currentHP = Math.min(player.maxHP, player.currentHP + hpRegenAmount);
            }

            // MP 恢復
            const mpRegenAmount = player.MPRegen;
            if (player.currentMP < player.maxMP) {
                player.currentMP = Math.min(player.maxMP, player.currentMP + mpRegenAmount);
            }

            updatePlayerUI();
        }

        function playerDefeat() {
            if (player.isDefeated) return;
            
            player.isDefeated = true;
            player.currentHP = 0;
            player.defeatCooldown = DEFEAT_COOLDOWN_SECONDS; 
            
            // 清除當前怪物
            monsters = []; 
            updateMonsterUI();
            
            logCombat(`💀 <span class='log-status'>${player.name} 戰敗了！等待 ${DEFEAT_COOLDOWN_SECONDS} 秒後復活...</span>`, 'log-status');
            updatePlayerUI();
        }

        function handleDefeatCooldown() {
            if (player.defeatCooldown > 0) {
                player.defeatCooldown--;
                document.getElementById('cooldown-status').textContent = `❌ 戰敗冷卻中 (${player.defeatCooldown}s)`;
            } else {
                player.isDefeated = false;
                player.currentHP = player.maxHP;
                player.currentMP = player.maxMP;
                spawnMonster(); // 重新生成怪物
                logCombat(`✨ <span class='log-status'>${player.name} 已復活，戰鬥準備!</span>`, 'log-status');
                updatePlayerUI();
            }
        }
        
        function logCombat(message, className = 'log-default') {
            const logOutput = document.getElementById('log-output');
            const p = document.createElement('p');
            
            // 添加時間戳
            const timestamp = new Date().toLocaleTimeString('zh-TW', { hour12: false });
            p.innerHTML = `[${timestamp}] ${message}`;
            p.className = className;
            
            logOutput.appendChild(p);
            
            // 滾動到最底部
            logOutput.scrollTop = logOutput.scrollHeight;
        }
        
        function formatNumber(num) {
            if (typeof num !== 'number') return num;
            if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
            if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
            if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
            return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        // --- 怪物生成與物品掉落 ---
        
        function createMonster(zoneLevel) {
            // 基礎等級隨機範圍 (根據區域等級)
            const minLvl = ZONE_CONFIGS[currentZoneIndex].minLevel;
            const maxLvl = ZONE_CONFIGS[currentZoneIndex].maxLevel;
            const level = Math.floor(Math.random() * (maxLvl - minLvl + 1)) + minLvl;
            
            // 隨機組合名稱
            const prefix = MONSTER_PREFIXES[Math.floor(Math.random() * MONSTER_PREFIXES.length)];
            const core = MONSTER_CORES[Math.floor(Math.random() * MONSTER_CORES.length)];
            const suffix = MONSTER_SUFFIXES[Math.floor(Math.random() * MONSTER_SUFFIXES.length)];
            let name = `${prefix} ${core} ${suffix}`;
            
            // 應用特殊怪物詞綴 (機率性)
            let multiplier = 1.0;
            let expBonus = 1.0;
            let monsterLevelMultiplier = 1;
            
            let specialConfig = null;
            for(const config of SPECIAL_MONSTER_CONFIG) {
                if (Math.random() < config.chance) {
                    specialConfig = config;
                    break;
                }
            }
            
            if (specialConfig) {
                 name = `${specialConfig.prefix} ${name}`;
                 multiplier = specialConfig.multiplier;
                 expBonus = specialConfig.expBonus;
            }

            // 基礎屬性計算 (隨等級成長)
            monsterLevelMultiplier = 1 + (level - 1) * 0.15; // 基礎成長 15% / 級
            
            const baseHP = Math.floor(100 * monsterLevelMultiplier * multiplier);
            const baseATK = Math.floor(20 * monsterLevelMultiplier * multiplier);
            const baseDEF = Math.floor(5 * monsterLevelMultiplier * REGULAR_MONSTER_MULTIPLIER); 

            // 怪物屬性
            const monster = {
                id: Date.now() + Math.random(),
                name: name,
                level: level,
                maxHP: baseHP,
                currentHP: baseHP,
                PATK: baseATK,
                MATK: Math.floor(baseATK * 0.8), // 法攻略低
                PDEF: baseDEF,
                MDEF: baseDEF,
                PDR: Math.min(90, Math.floor(baseDEF * 0.5)),
                MDR: Math.min(90, Math.floor(baseDEF * 0.5)),
                expValue: Math.floor(level * 50 * expBonus), 
                attackCooldown: 0,
            };
            
            return monster;
        }

        function spawnMonster() {
            monsters = [];
            const currentZone = ZONE_CONFIGS[currentZoneIndex];
            const maxMonsters = Math.floor(Math.random() * 5) + 6; // 6 到 10 隻

            for (let i = 0; i < maxMonsters; i++) {
                monsters.push(createMonster(currentZone.minLevel));
            }
            
            logCombat(`新的區域怪物出現了 (${monsters.length} 隻)!`, 'log-status');
            updateMonsterUI();
        }
        
        function handleItemDrop(monster) {
            let dropChance = BASE_DROP_CHANCE;
            // LUK 影響掉寶率
            dropChance += player.LUK * 0.001;
            
            // SPL 影響物品品質
            const splTierBonus = Math.min(0.2, player.SPL * 0.001); 

            if (Math.random() < dropChance) {
                // 掉落物品
                const item = generateItem(monster.level, splTierBonus);
                
                // 檢查物品欄空間
                if (player.inventory.length >= player.level * MAX_INVENTORY_MULTIPLIER) {
                     logCombat(`⚠️ <span class='log-item-drop'>${item.name}</span> 掉落，但物品欄已滿！`, 'log-status');
                     return;
                }
                
                player.inventory.push(item);
                
                const tierColor = TIER_CONFIG[item.tier].color;
                logCombat(`獲得物品：<span class='${tierColor}'>${item.name}</span>`, 'log-item-drop');
            }
        }
        
        function generateItem(monsterLevel, splTierBonus) {
            // 1. 決定品階
            let tier = 'T0';
            let cumulativeChance = 0;
            const randomRoll = Math.random();
            
            for (const t of TIER_ORDER) {
                let chance = TIER_CONFIG[t].chance;
                
                // T4/T5 品階受 SPL 影響
                if (t === 'T5' || t === 'T4') {
                     chance += splTierBonus; 
                }

                cumulativeChance += chance;
                if (randomRoll < cumulativeChance) {
                    tier = t;
                    break;
                }
            }
            
            const tierConf = TIER_CONFIG[tier];
            
            // 2. 決定等級
            const minLvl = Math.max(1, monsterLevel - 5);
            const itemLevel = Math.floor(Math.random() * 11) + minLvl; // 怪物等級 -5 到 +5 級
            
            // 3. 決定部位
            const slotKeys = Object.keys(EQUIPMENT_SLOTS);
            const slot = slotKeys[Math.floor(Math.random() * slotKeys.length)];
            
            // 4. 生成屬性
            const statKeys = STAT_KEYS.slice(0, 4); // 只選擇 STR, INT, CON, AGI 作為主要加成
            const numStats = Math.floor(Math.random() * 3) + 1; // 1 到 3 個屬性
            let stats = {};
            let selectedStats = [];
            
            while (selectedStats.length < numStats) {
                const stat = statKeys[Math.floor(Math.random() * statKeys.length)];
                if (!selectedStats.includes(stat)) {
                    selectedStats.push(stat);
                }
            }
            
            selectedStats.forEach(stat => {
                let baseValue = Math.floor(Math.random() * (tierConf.maxStat - tierConf.minStat + 1)) + tierConf.minStat;
                // 等級對屬性的影響
                let finalValue = Math.floor(baseValue * (1 + itemLevel / 100)); 
                stats[stat] = finalValue;
            });
            
            // 5. 組合名稱
            const material = ["粗糙的", "強化", "魔化", "古代", "精靈", "龍鱗", "虛空", "傳說"][Math.floor(Math.random() * 8)];
            const type = EQUIPMENT_SLOTS[slot];
            const name = `${tierConf.display} ${material} ${type}`;
            
            return {
                id: Date.now() + Math.random() + Math.random(), 
                name: name,
                slot: slot,
                tier: tier,
                minLevel: itemLevel,
                stats: stats
            };
        }
        
        // --- 裝備/物品欄操作 ---
        
        function equipItem(item) {
            if (player.level < item.minLevel) {
                logCombat(`⚠️ <span class='log-name'>${player.name}</span> 等級不足 (Lv.${player.level})，無法裝備 <span class='${TIER_CONFIG[item.tier].color}'>${item.name}</span> (需求 Lv.${item.minLevel})。`, 'log-status');
                return;
            }
            
            const slot = item.slot;
            let oldItem = player.equipment[slot];

            // 1. 移除舊裝備 (如果有)
            if (oldItem) {
                player.inventory.push(oldItem); // 舊裝備放入背包
                logCombat(`將舊的 <span class='${TIER_CONFIG[oldItem.tier].color}'>${oldItem.name}</span> 卸下並放回物品欄。`, 'log-status');
            }
            
            // 2. 裝備新物品
            player.equipment[slot] = item;
            
            // 3. 從物品欄移除新物品
            player.inventory = player.inventory.filter(i => i.id !== item.id);

            logCombat(`成功裝備 <span class='${TIER_CONFIG[item.tier].color}'>${item.name}</span> 到 [${EQUIPMENT_SLOTS[slot]}] 部位。`, 'log-status');
            
            calculateStats();
            updatePlayerUI();
            renderInventory(); // 更新物品欄和模態框
        }

        function deleteItem(itemId) {
            const item = player.inventory.find(i => i.id === itemId);
            if (!item) return;

            if (confirm(`確定要刪除 ${item.name} 嗎？此操作不可逆！`)) {
                player.inventory = player.inventory.filter(i => i.id !== itemId);
                logCombat(`🚮 銷毀了 <span class='${TIER_CONFIG[item.tier].color}'>${item.name}</span>。`, 'log-status');
                renderInventory();
            }
        }
        
        function deleteFilteredItems() {
             const filterValue = document.getElementById('inventory-filter').value;
             const itemsToDelete = player.inventory.filter(item => {
                 return filterValue !== 'ALL' && item.tier === filterValue;
             });

             if (itemsToDelete.length === 0) {
                 alert('當前篩選條件下沒有可銷毀的物品。');
                 return;
             }
             
             if (confirm(`確定要銷毀 ${itemsToDelete.length} 件品階為 ${TIER_CONFIG[filterValue].display} 的物品嗎？此操作不可逆！`)) {
                 player.inventory = player.inventory.filter(item => {
                     return filterValue === 'ALL' || item.tier !== filterValue;
                 });
                 logCombat(`🔥 批量銷毀了 ${itemsToDelete.length} 件品階為 <span class='${TIER_CONFIG[filterValue].color}'>${TIER_CONFIG[filterValue].display}</span> 的物品。`, 'log-status');
                 renderInventory();
             }
        }

        function createItemTooltip(item) {
            const tooltip = document.createElement('div');
            tooltip.className = 'item-tooltip';
            
            // 顏色 class
            const tierColorClass = TIER_CONFIG[item.tier].color;
            
            let html = `<div class="item-tooltip-header"><span class="${tierColorClass}">${item.name}</span> <span style="float: right; color: #fff;">[Lv.${item.minLevel}]</span></div>`;
            html += `<p style="margin: 0;">部位: ${EQUIPMENT_SLOTS[item.slot]}</p>`;
            html += `<p style="margin: 5px 0 0 0; font-weight: bold;">屬性加成:</p>`;

            let hasStats = false;
            for (const stat in getItemStats(item)) {
                if (item.stats[stat] !== 0) {
                    html += `<p class="item-tooltip-stat" style="margin: 0 0 0 10px;">+${item.stats[stat]} ${stat}</p>`;
                    hasStats = true;
                }
            }
            
            if (!hasStats) {
                 html += `<p style="margin: 0 0 0 10px; color: #777;">無基礎屬性加成</p>`;
            }

            tooltip.innerHTML = html;
            return tooltip;
        }
        
        function renderEquipmentSlots() {
            const grid = document.getElementById('equipment-slots-grid');
            grid.innerHTML = '';
            
            for (const slotId in EQUIPMENT_SLOTS) {
                const item = player.equipment[slotId];
                const slotDiv = document.createElement('div');
                slotDiv.className = 'equipment-slot';
                
                let itemName = '未裝備';
                let tierClass = '';
                
                if (item) {
                    tierClass = TIER_CONFIG[item.tier].color;
                    itemName = item.name;
                }
                
                slotDiv.innerHTML = `
                    <span style="font-size: 0.8em; font-weight: bold; color: #3498db;">[${EQUIPMENT_SLOTS[slotId]}]</span>
                    <span class="equipped-item-name ${tierClass}" title="${itemName}">
                        ${itemName}
                    </span>
                `;
                
                // 添加卸下按鈕和 Tooltip
                if (item) {
                    const unequipBtn = document.createElement('button');
                    unequipBtn.className = 'delete-btn';
                    unequipBtn.textContent = '卸下';
                    unequipBtn.style.marginTop = '3px';
                    unequipBtn.onclick = () => unequipItem(slotId);
                    slotDiv.appendChild(unequipBtn);
                    
                    // 裝備 Tooltip
                    const tooltip = createItemTooltip(item);
                    slotDiv.appendChild(tooltip);
                }
                
                grid.appendChild(slotDiv);
            }
        }
        
        function unequipItem(slotId) {
            const item = player.equipment[slotId];
            if (!item) return;

            if (player.inventory.length >= player.level * MAX_INVENTORY_MULTIPLIER) {
                 logCombat(`⚠️ 卸下 <span class='${TIER_CONFIG[item.tier].color}'>${item.name}</span> 失敗，物品欄已滿！`, 'log-status');
                 return;
            }

            player.equipment[slotId] = null;
            player.inventory.push(item);

            logCombat(`將 <span class='${TIER_CONFIG[item.tier].color}'>${item.name}</span> 卸下並放回物品欄。`, 'log-status');
            
            calculateStats();
            updatePlayerUI();
            renderInventory(); 
        }

        function renderEquipmentBonusSummary() {
            const summaryDiv = document.getElementById('equipment-bonus-summary');
            summaryDiv.innerHTML = '';
            
            // 重新計算裝備加成總和
            let equipmentBonus = {};
            for (const key of STAT_KEYS) {
                equipmentBonus[key] = 0;
            }
            for (const slot in player.equipment) {
                const item = player.equipment[slot];
                if (item && item.stats) {
                    for (const stat in getItemStats(item)) {
                        if (equipmentBonus[stat] !== undefined) {
                            equipmentBonus[stat] += getItemStats(item)[stat];
                        }
                    }
                }
            }

            let hasBonus = false;
            for (const stat of STAT_KEYS) {
                const value = equipmentBonus[stat];
                if (value !== 0) {
                    const p = document.createElement('div');
                    const sign = value > 0 ? '+' : '';
                    p.innerHTML = `${stat}: <span style="font-weight: bold; color: #3498db;">${sign}${formatNumber(value)}</span>`;
                    summaryDiv.appendChild(p);
                    hasBonus = true;
                }
            }
            
            if (!hasBonus) {
                 summaryDiv.innerHTML = `<p style="grid-column: 1 / 4; text-align: center; color: #7f8c8d;">目前沒有裝備提供額外素質加成。</p>`;
            }
        }
        
        // --- 事件處理與儲存 ---
        
        function handleZoneChange(direction) {
            const newIndex = currentZoneIndex + direction;
            if (newIndex >= 0 && newIndex < ZONE_CONFIGS.length) {
                currentZoneIndex = newIndex;
                monsters = []; // 離開區域清空怪物
                logCombat(`進入新區域: <span class='log-status'>${ZONE_CONFIGS[currentZoneIndex].name}</span>`, 'log-status');
                spawnMonster();
                renderZoneUI();
                updateMonsterUI();
            }
        }

        function handleSkillToggle(event) {
            const skillId = event.target.dataset.skillId;
            player.autoSkills[skillId] = event.target.checked;
            logCombat(`技能 <span class='${SKILLS[skillId].type === 'Physical' ? 'log-skill-phys' : 'log-skill-magic'}'>${SKILLS[skillId].name}</span> 自動施放已${event.target.checked ? '啟用' : '停用'}。`, 'log-status');
            renderSkills(); // 重新渲染確保狀態一致性
        }
        
        function handleStatAllocation(event) {
            const btn = event.target.closest('.add-point-btn');
            if (!btn || player.StatPoints <= 0) return;
            
            const stat = btn.dataset.stat;
            const amount = parseInt(btn.dataset.amount);
            
            if (player.StatPoints >= amount) {
                player.StatPoints -= amount;
                player[`allocated${stat}`] += amount;
                
                logCombat(`分配 ${amount} 點到 ${stat}。`, 'log-status');
                calculateStats();
                updatePlayerUI();
            } else {
                 alert(`剩餘點數不足 ${amount} 點。`);
            }
        }

        // --- 存檔/讀檔 ---
        
        function saveGame() {
            const saveData = {
                player: player,
                currentZoneIndex: currentZoneIndex,
                lastSaveTime: new Date().toISOString(),
                autoSaveEnabled: autoSaveEnabled
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
            lastSaveTime = saveData.lastSaveTime;
            document.getElementById('last-save-time').textContent = new Date(lastSaveTime).toLocaleString('zh-TW');
            logCombat("<span class='log-status'>💾 遊戲進度已保存。</span>", 'log-status');
        }

        function loadGame() {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (!savedData) {
                logCombat("<span class='log-status'>📂 找不到本地存檔。</span>", 'log-status');
                return false;
            }

            try {
                const data = JSON.parse(savedData);
                
                // 合併/覆蓋數據，確保新版本有新屬性
                player = { ...initializePlayerObject(), ...data.player };
                currentZoneIndex = data.currentZoneIndex;
                lastSaveTime = data.lastSaveTime;
                autoSaveEnabled = data.autoSaveEnabled;

                // 確保技能冷卻表也重新生成，防止舊存檔帶入錯誤數據
                for (const id in SKILLS) {
                     skillCooldowns[id] = 0;
                }
                
                // 重啟遊戲循環以應用新狀態
                clearInterval(gameLoopInterval);
                clearInterval(regenLoopInterval);
                if (autoSaveTimer) clearInterval(autoSaveTimer);
                initializeGame();
                
                document.getElementById('auto-save-checkbox').checked = autoSaveEnabled;
                document.getElementById('last-save-time').textContent = new Date(lastSaveTime).toLocaleString('zh-TW');
                logCombat("<span class='log-status'>📂 遊戲進度已成功讀取。</span>", 'log-status');
                return true;
            } catch (e) {
                console.error("讀取存檔失敗:", e);
                logCombat("<span class='log-status'>❌ 讀取存檔失敗，檔案可能已損壞。</span>", 'log-status');
                return false;
            }
        }
        
        function deleteSave() {
             if (confirm("⚠️ 警告：您確定要刪除所有遊戲存檔並重置遊戲進度嗎？此操作不可逆！")) {
                 localStorage.removeItem(STORAGE_KEY);
                 location.reload(); // 重新載入頁面以啟動新的初始化
             }
        }

        // --- 模態框與事件綁定 ---

        document.addEventListener('DOMContentLoaded', () => {
            
            // 首次嘗試載入存檔，如果失敗則初始化新遊戲
            if (!loadGame()) {
                initializeGame(); 
            }
            
            // --- 模態框事件 ---
            const statsModal = document.getElementById('statsModal');
            const settingsModal = document.getElementById('settingsModal');
            
            // 開啟模態框按鈕
            document.getElementById('open-stats').onclick = () => {
                statsModal.style.display = 'block';
                // 每次打開重新渲染物品欄
                inventoryCurrentPage = 1;
                renderInventory();
            }
            document.getElementById('header-settings-button').onclick = () => {
                settingsModal.style.display = 'block';
            }

            // 關閉模態框按鈕
            document.querySelectorAll('.close-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const modalId = e.target.dataset.modal;
                    document.getElementById(modalId).style.display = 'none';
                    updatePlayerUI(); // 關閉時更新屬性面板
                };
            });

            // 點擊模態框以外區域關閉
            window.onclick = (event) => {
                if (event.target === statsModal) {
                    statsModal.style.display = 'none';
                    updatePlayerUI();
                }
                if (event.target === settingsModal) {
                    settingsModal.style.display = 'none';
                }
            };
            
            // --- 遊戲控制事件 ---
            document.getElementById('prev-zone').addEventListener('click', () => handleZoneChange(-1));
            document.getElementById('next-zone').addEventListener('click', () => handleZoneChange(1));
            document.getElementById('clear-log-button').addEventListener('click', () => {
                document.getElementById('log-output').innerHTML = '';
            });
            
            // --- 屬性分配事件 ---
            document.getElementById('stat-allocation-grid').addEventListener('click', handleStatAllocation);
            
            // --- 存檔/設定事件 ---
            document.getElementById('save-button').addEventListener('click', saveGame);
            document.getElementById('load-button').addEventListener('click', loadGame);
            document.getElementById('delete-save-button').addEventListener('click', deleteSave);
            
            // --- 物品欄事件 ---
            document.getElementById('inventory-filter').addEventListener('change', (event) => {
                 inventoryFilter = event.target.value;
                 inventoryCurrentPage = 1;
                 renderInventory();
            });
            document.getElementById('mass-delete-button').addEventListener('click', deleteFilteredItems);

            // 玩家名稱編輯
            document.getElementById('edit-name-btn').addEventListener('click', () => {
                const newName = prompt("請輸入新的角色名稱:", player.name);
                if (newName && newName.trim() !== "") {
                    player.name = newName.trim();
                    updatePlayerUI();
                }
            });
            
            // 自動存檔切換
            document.getElementById('auto-save-checkbox').addEventListener('change', (event) => {
                 autoSaveEnabled = event.target.checked;
                 if (autoSaveEnabled) {
                     autoSaveTimer = setInterval(saveGame, AUTOSAVE_INTERVAL_MS);
                     logCombat("<span class='log-status'>💾 自動存檔已啟用。</span>");
                 } else {
                     clearInterval(autoSaveTimer);
                     logCombat("<span class='log-status'>💾 自動存檔已停用。</span>");
                 }
            });
            
            // 物品欄分頁按鈕
            document.getElementById('prev-page-btn').addEventListener('click', () => {
                if (inventoryCurrentPage > 1) {
                    inventoryCurrentPage--;
                    renderInventory();
                }
            });
            document.getElementById('next-page-btn').addEventListener('click', () => {
                const totalItems = player.inventory.filter(item => {
                    return inventoryFilter === 'ALL' || item.tier === inventoryFilter;
                }).length;
                const totalPages = Math.ceil(totalItems / INVENTORY_ITEMS_PER_PAGE);

                if (inventoryCurrentPage < totalPages) {
                    inventoryCurrentPage++;
                    renderInventory();
                }
            });
            

        });

        // --- 核心啟動函數結束 ---
        
    