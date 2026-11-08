(() => {
    const byId = id => document.getElementById(id);
    const slots = ["무기", "옷", "머리", "팔·장식", "다리"];
    const heroes = allItems.map(item => ({
        image: item.image, name: item.name, rarity: "영웅", slot: item.type === "weapon" ? item.image.split("/")[2] : ({Cheat:"옷", Head:"머리", Arm:"팔·장식", leg:"다리"})[item.type],
        stats: Object.fromEntries(Object.entries(item.statValues).map(([key,v]) => [statNames[key],v])),
        effects: item.effects || []
    }));
    const catalog = [...heroes, ...[...legendarySearchItems, ...additionalLegendaryItems].map(item => ({...item, image:"img/전설/"+item.name+".webp", rarity:"전설"}))];
    const slotOf = item => weaponBases[item.slot] ? "무기" : item.slot;
    const variants = characterData.flatMap(c => Object.keys(c.weapons).map(weapon => ({...c, weapon})))
        .sort((a,b) => a.name.localeCompare(b.name,"ko") || a.weapon.localeCompare(b.weapon,"ko"));
    let character = variants[0], level = 1, serial = 1, selectedSlot = "무기", returnScroll = 0;
    const sets = [{id:1, gear:{}, adjustments:{}}];
    let active = sets[0];

    function element(tag, text, className) {
        const node = document.createElement(tag);
        if (text !== undefined) node.textContent = text;
        if (className) node.className = className;
        return node;
    }
    function button(text, click, pressed) {
        const node = element("button", text);
        node.onclick = click;
        if (pressed !== undefined) node.setAttribute("aria-pressed", pressed);
        return node;
    }
    function selectVariant(v) {
        character = v;
        render();
    }
    const weaponIcons = {
    "글러브": "img/무기 종류/대표 이미지/01. Glove.png",
    "톤파": "img/무기 종류/대표 이미지/02. Tonfa.png",
    "방망이": "img/무기 종류/대표 이미지/03. Bat.png",
    "망치": "img/무기 종류/대표 이미지/04. Hammer.png",
    "채찍": "img/무기 종류/대표 이미지/05. Whip.png",
    "투척": "img/무기 종류/대표 이미지/06. Throwing.png",
    "암기": "img/무기 종류/대표 이미지/07. Shuriken.png",
    "활": "img/무기 종류/대표 이미지/08. Bow.png",
    "석궁": "img/무기 종류/대표 이미지/09. Crossbow.png",
    "권총": "img/무기 종류/대표 이미지/10. Pistol.png",
    "돌격 소총": "img/무기 종류/대표 이미지/11. Assault Rifle.png",
    "저격총": "img/무기 종류/대표 이미지/12. Sniper Rifle.png",
    "도끼": "img/무기 종류/대표 이미지/13. Axe.png",
    "단검": "img/무기 종류/대표 이미지/14. Dagger.png",
    "양손검": "img/무기 종류/대표 이미지/15. Twohanded Sword.png",
    "쌍검": "img/무기 종류/대표 이미지/16. Dual Sword.png",
    "창": "img/무기 종류/대표 이미지/17. Spear.png",
    "쌍절곤": "img/무기 종류/대표 이미지/18. Nunchaku.png",
    "레이피어": "img/무기 종류/대표 이미지/19. Rapier.png",
    "기타": "img/무기 종류/대표 이미지/20. Guitar.png",
    "카메라": "img/무기 종류/대표 이미지/21. Camera.png",
    "아르카나": "img/무기 종류/대표 이미지/22. Arcana.png",
    "VF의수": "img/무기 종류/대표 이미지/23. VF Prosthetic.png"
};
    function characters() {
        const list = byId("characters");
        list.replaceChildren();
        const query = compact(byId("characterQuery").value);
        for (const v of variants) {
            const fields = [v.name + v.weapon, ...v.aliases.map(alias => alias + v.weapon)].map(compact);
            if (!fields.some(f => [...query].every(c => f.includes(c)))) continue;
            const b = button("", () => selectVariant(v), v === character);
            b.className = "character-card";
            b.title = v.name + " · " + v.weapon;
            b.setAttribute("aria-label", b.title);
            const portrait = element("img", undefined, "character-portrait");
            portrait.src = "img/실험체/" + v.name + ".webp";
            portrait.alt = "";
            portrait.loading = "lazy";
            const icon = element("img", undefined, "character-weapon");
            icon.src = weaponIcons[v.weapon];
            icon.alt = "";
            b.append(portrait, element("span", v.name, "character-name"), icon);
            list.append(b);
        }
        if (!list.childElementCount) list.textContent = "검색 결과가 없습니다.";
    }
    function addSet(gear = {}) {
        active = {id:++serial, gear, adjustments:{}};
        sets.push(active);
    }
    function gearCard(item, click, pressed) {
        const card = button("", () => { hideTooltip(); click(); }, pressed);
        card.className = "gear-card " + (item.rarity === "전설" ? "legend" : "hero");
        const img = element("img");
        img.src = item.image;
        img.alt = "";
        card.append(img, element("span", item.name));
        card.setAttribute("aria-label", item.rarity + " " + item.name);
        card.onpointerenter = event => {
            if (event.pointerType !== "touch") showTooltip({...item, type:item.rarity+" · "+item.slot}, event);
        };
        card.onpointermove = moveTooltip;
        card.onpointerleave = hideTooltip;
        return card;
    }
    function equipment() {
        const tabs = byId("setTabs"), equipped = byId("equipped");
        tabs.replaceChildren(...sets.map((set, index) => {
            const tab = element("span", undefined, "set-tab");
            const name = "세트 " + set.id;
            tab.append(button(name, () => { active = set; render(); }, set === active));
            if (sets.length > 1) {
                const close = button("×", () => {
                    sets.splice(index, 1);
                    if (active === set) active = sets[Math.min(index, sets.length - 1)];
                    render();
                    tabs.querySelector('[aria-pressed="true"]').focus({preventScroll:true});
                });
                close.title = name + " 삭제";
                close.setAttribute("aria-label", close.title);
                tab.append(close);
            }
            return tab;
        }));
        equipped.replaceChildren();
        for (const slot of slots) {
            const row = element("div", undefined, "equipment-line");
            const item = active.gear[slot];
            const select = () => {
                if (selectedSlot !== slot) byId("gearQuery").value = "";
                selectedSlot = slot;
                equipment();
            };
            row.append(element("small",slot), item ? gearCard(item, select, selectedSlot === slot)
                : button("미장착", select, selectedSlot === slot));
            if (item) {
                row.append(button("해제", () => {delete active.gear[slot]; render();}));
                const stats = element("div", undefined, "gear-stats");
                for (const [key,value] of Object.entries(item.stats)) stats.append(element("div",key+" +"+value));
                for (const effect of item.effects) stats.append(element("div",effect.name,"gear-effect-name"));
                row.append(stats);
            }
            equipped.append(row);
        }
        gearPicker();
    }
    function gearPicker() {
        const list = byId("gearPicker"), rarity = byId("compareRarity").value;
        const terms = byId("gearQuery").value.trim().split(/\s+/).map(compact);
        list.replaceChildren();
        for (const item of catalog) {
            if (slotOf(item) !== selectedSlot || (selectedSlot === "무기" && item.slot !== character.weapon)) continue;
            if (rarity !== "전체 등급" && rarity !== item.rarity) continue;
            const fields = [item.name,...(itemAliases[item.name] || []),...Object.keys(item.stats),...item.effects.flatMap(e=>[e.name,e.description])].map(compact);
            if (!terms.every(t => fields.some(f=>f.includes(t)) || [...t].every(c=>compact(item.name).includes(c)))) continue;
            const b = gearCard(item, () => {active.gear[selectedSlot] = item; render();}, active.gear[selectedSlot] === item);
            list.append(b);
        }
        if (!list.childElementCount) list.textContent = "조건에 맞는 장비가 없습니다.";
    }
    function scaled([start,growth = 0]) { return start + growth * (level - 1); }
    function calculate(set, forSkill = false) {
        if (set.gear["무기"] && set.gear["무기"].slot !== character.weapon) return null;
        const flat = {}, pct = {};
        const items = Object.values(set.gear);
        for (const item of items) {
            for (const [key, raw] of Object.entries(item.stats)) {
                const [a,b] = String(raw).split("~").map(parseFloat);
                const value = b === undefined ? a : a + (b-a)*(level-1)/19;
                const target = String(raw).includes("%") ? pct : flat;
                const label = key.replace(/^레벨 당 /,"").replace(/^\(고유\) /,"");
                if (key.startsWith("(고유)")) {
                    target[key] = Math.max(target[key] || 0,value);
                } else target[label] = (target[label] || 0) + value;
            }
        }
        const f = k => flat[k] || 0, p = k => pct[k] || 0;
        const mastery = character.weapons[character.weapon];
        const m = k => mastery[k] ? scaled(mastery[k]) : 0;
        const base = k => scaled(character.base[k]);
        const ampType = Object.hasOwn(mastery,"스킬 증폭");
        const adaptive = f("맞춤형 능력치");
        const [weaponSpeed] = weaponBases[character.weapon];
        const hasEffect = name => items.some(i => i.effects.some(e => e.name === name));
        const extra = name => set.adjustments[name] || 0;
        const bonusHp = f("최대 체력") + extra("체력");
        const hp = base("체력") + bonusHp;
        let armor = base("방어력") + f("방어력") + extra("방어력") + (hasEffect("두 개의 가면") ? 8 : 0);
        const name = character.name, passive = (skillRanks.get(skillData[character.name].find(skill => skill.name.startsWith("패시브"))) || 1);
        const condition = Number(byId("skillCondition").value) || 0;
        const baseSpeed = base("공격 속도") + weaponSpeed;
        let speedBonus = m("공격 속도")+p("공격 속도")+extra("공격 속도");
        const haste = f("쿨다운 감소");
        let attack = base("공격력")+f("공격력")+m("공격력")+(ampType ? 0 : adaptive)+extra("공격력")+(hasEffect("묵직함") ? bonusHp*.02 : 0);
        let amp = f("스킬 증폭")+extra("스킬 증폭")+(ampType ? adaptive*2 : 0);
        let ampPercent = m("스킬 증폭")+p("스킬 증폭")+p("(고유) 스킬 증폭");
        let crit = p("치명타 확률"), critDamage = p("치명타 피해량");
        let regeneration = (base("체력 재생")+f("체력 재생"))*(1+p("체력 재생")/100);
        if (name === "실비아") {
            speedBonus += condition * [0.3,0.65,1][passive-1] + (condition>=10 ? 10 : 0);
            if (condition>=10) ampPercent += 5;
        }
        if (name==="루크") speedBonus += condition*[3,4,5][passive-1];
        let speed = baseSpeed * (1+speedBonus/100);
        switch (name) {
            case "에이든": if (condition) {speed -= .15; critDamage += crit*[.2,.3,.4][passive-1]-20; crit = 100;} break;
            case "헤이즈": if (condition) speed = 1; break;
            case "히스이": attack *= 1 + speedBonus*.0015; speed = baseSpeed + .025*(level-1); break;
            case "마르티나": attack *= 1 + Math.min(speedBonus,(2.5/baseSpeed-1)*100)*.002; speed = 2; break;
            case "나타폰": speed = baseSpeed; break;
            case "크레이버": speed = [.9,1.1,1.3][passive-1]; break;
            case "아델라": amp += (speed-baseSpeed)*100*[.1,.35,.6][passive-1]; speed = baseSpeed; break;
            case "칼라": amp += Math.max(0,speed-1.1)*100; speed = Math.min(speed,1.1); break;
            case "띠아": case "셀린": amp += haste; break;
            case "데비&마를렌": crit += critDamage; critDamage = 0; if (condition) armor += 5*passive; break;
            case "매그너스": armor *= 1 + condition*[.02,.025,.03][passive-1]; if (condition===10) regeneration += 2+passive; break;
            case "시셀라": amp += [4,7,10][passive-1] + ([28,39,50][passive-1]-[4,7,10][passive-1])*condition/100;
                regeneration += 2*passive + (10*passive-2*passive)*condition/100; break;
            case "블레어": if (condition) {speedBonus += 15; speed = baseSpeed*(1+speedBonus/100);} break;
        }
        const totals = {
            "최대 체력": hp,
            "방어력": armor,
            "실질 체력": hp * (1 + armor/100),
            "체력 재생": regeneration,
            "공격력": attack,
            "공격 속도": speed,
            "치명타 확률 (%)": Math.min(100,crit),
            "추가 치명타 피해량 (%)": critDamage,
            "스킬 증폭": amp*(1+ampPercent/100),
            "쿨다운 감소": name === "셀린" ? 0 : haste,
            "이동 속도": (base("이동 속도")+f("이동 속도")-(name==="헤이즈" && condition ? .3 : 0))*(1+(p("이동 속도")+extra("이동 속도"))/100),
        };
        if (name==="리오") {
            totals["기본 공격 피해 배율 (%)"] = 102 + totals["치명타 확률 (%)"]*(75+critDamage)/100;
            totals["대상 방어력 감소 (%)"] = [2,5,8][passive-1] + totals["치명타 확률 (%)"]*.1;
        }
        if (!forSkill) return {totals, speedBonus};
        const values = {...totals, "체력":hp, "추가 체력":bonusHp, "추가 공격력":attack-base("공격력"),
            "추가 방어력":armor-base("방어력"), "추가 공격 속도":speedBonus, "공격 속도":speedBonus,
            "치명타 확률":totals["치명타 확률 (%)"], "추가 치명타 피해량":critDamage,
            "레벨":level, "캐릭터 레벨":level, [name+" 레벨"]:level, "방어 관통":f("방어 관통"),
            "기본 공격 증폭":m("기본 공격 증폭")+p("기본 공격 증폭")};
        if (name==="데비&마를렌") values["표식 피해 배율"] = 1 + values["치명타 확률"]*.005;
        if (name==="나딘") Object.assign(values,{"야성 중첩":condition,"야성 중첩 수":condition});
        if (name==="클로에") values["니나 공격력"] = attack*(.6+.02*(level-1)) + [4,7,10][passive-1];
        return values;
    }
    const fmt = n => Number(n.toFixed(3)).toLocaleString("ko",{maximumFractionDigits:3});
    const cooldownRate = haste => 100 * haste / (100 + haste);
    function statText(key, value, speedBonus) {
        if (key === "공격 속도") return fmt(speedBonus) + "% (" + fmt(value) + ")";
        return key === "쿨다운 감소" ? fmt(value) + " (" + fmt(cooldownRate(value)) + "%)" : fmt(value);
    }
    function equippedEffects(set, detailed) {
        const list = element("ul", undefined, "equipped-effects");
        for (const slot of slots) {
            const item = set.gear[slot];
            if (!item) continue;
            const entries = [...item.effects];
            for (const [name, value] of Object.entries(item.stats)) {
                if (["생명력 흡수","모든 피해 흡혈"].includes(name) || name.startsWith("(고유) "))
                    entries.push({name:name.replace(/^\(고유\) /,"")+" +"+value});
            }
            for (const effect of entries) {
                const row = element("li", effect.name + " · " + item.name);
                if (detailed && effect.description) row.append(element("small",effect.description));
                list.append(row);
            }
        }
        if (!list.childElementCount) list.append(element("li","없음"));
        return list;
    }
    byId("showBaseStats").onclick = () => {
        const table = byId("baseStatRows");
        table.replaceChildren();
        byId("baseStatTitle").textContent = character.name + " 기본 스탯";
        function addRows(stats, mastery) {
            for (const [key, values] of Object.entries(stats)) {
                const row = table.insertRow();
                row.append(element("th", key));
                const suffix = mastery && key !== "공격력" ? "%" : "";
                for (const value of values) row.insertCell().textContent = fmt(value) + suffix;
                if (values.length === 1) row.lastElementChild.colSpan = 2;
            }
        }
        addRows(character.base,false);
        const weapon = element("th",character.weapon);
        weapon.colSpan = 3;
        table.insertRow().append(weapon);
        addRows(character.weapons[character.weapon],true);
        byId("baseStatDialog").showModal();
    };
    const conditions = {
        "에이든":["일반 0 / 과전하 1",1], "헤이즈":["기본 0 / 로켓 런처 1",1], "루크":["공격 속도 중첩",8],
        "나딘":["야성 중첩",250], "매그너스":["근성 중첩",10], "실비아":["탐색한 지역 수",10],
        "시셀라":["잃은 체력 (%)",100], "데비&마를렌":["마를렌 0 / 데비 1",1], "블레어":["쌍날검 0 / 쌍검 1",1]
    };
    const skillRanks = new Map();
    let skillOwner = "";
    function syncSkillControls() {

        if (skillOwner !== character.name) {
            skillOwner = character.name;
            skillRanks.clear();
            byId("skillCondition").value = 0;

            const config = conditions[character.name];
            byId("skillConditionLabel").hidden = !config;
            if (config) {
                byId("skillConditionLabel").querySelector("span").textContent = config[0];
                byId("skillCondition").max = config[1];
            }
        }
    }
    function maxSkillRank(skill) {
        let max = 1;
        const lines = skill.parts ? skill.parts.flatMap(part => part.lines) : skill.lines;
        for (const line of lines.concat(skill.sharedLines || [])) {
            for (const [sequence] of line.matchAll(/-?\d+(?:\.\d+)?%?(?:\s*\/\s*-?\d+(?:\.\d+)?%?)+/g)) {
                max = Math.max(max, sequence.split("/").length);
            }
        }
        return max;
    }
    function renderSkills() {
        byId("skillOutput").replaceChildren(...skillData[character.name].map(renderSkill));
    }
    function renderSkill(skill,index) {
        const rank = skillRanks.get(skill) || 1;
        const select = element("select");
        select.setAttribute("aria-label", skill.name + " 레벨");
        const max = maxSkillRank(skill);
        for (let level = 1; level <= max; level++) select.add(new Option("Lv. " + level, level));
        select.value = rank;
        select.onchange = () => {
            skillRanks.set(skill, Number(select.value));
            totalsView();
            byId("skillOutput").querySelectorAll("article select")[index].focus({preventScroll:true});
        };
        const article = element("article");
        if (skill.parts) {
            const heading = element("h3",skill.name);
            heading.append(select);
            article.append(heading);
        }
        const parts = skill.parts || [{name:skill.name, icon:skill.icons[0], lines:skill.lines}];
        for (const part of parts) {
            const block = element("div",undefined,"skill-part");
            const heading = element(skill.parts ? "h4" : "h3");
            const icon = element("img");
            icon.src = part.icon;
            icon.alt = "";
            heading.append(icon,part.name);
            if (!skill.parts) heading.append(select);
            block.append(heading);
            renderSkillLines(block,skill.name,part.lines,rank);
            article.append(block);
        }
        if (skill.sharedLines) renderSkillLines(article,skill.name,skill.sharedLines,rank);
        return article;
    }
    function renderSkillLines(output,skillName,lines,rank) {
        const fixedCooldown = lines.some(l=>l.startsWith("쿨다운 고정")) || character.name==="셀린" ||
            (["띠아","펠릭스"].includes(character.name) && /^[QWE]\s/.test(skillName));
        const values = sets.map(set=>{
            const context = calculate(set,true);
            if (context) context["유효 스킬 가속"] = fixedCooldown ? 0 : context["쿨다운 감소"];
            return context;
        });
        const table = element("table");
        const head = table.createTHead().insertRow();
        head.append(element("th","상세 정보"),...sets.map(set=>element("th","세트 "+set.id)));
        const body = table.createTBody();
        for (const line of lines) {
            const parsed = evaluateSkillLine(line,rank,values.find(Boolean) || {});
            if (!parsed) {
                output.append(element("p",line));
                continue;
            }
            const row = body.insertRow(), label = element("th",parsed.label);
            label.append(element("small",line.slice(parsed.label.length).trim()));
            row.append(label);
            for (const context of values) row.insertCell().textContent = context ? evaluateSkillLine(line,rank,context).result : "무기군 불일치";
        }
        if (body.rows.length) output.append(table);
    }
    byId("skillCondition").oninput = () => {
        const field = byId("skillCondition");
        if (field.value !== "") field.value = Math.max(0,Math.min(Number(field.max),Math.floor(Number(field.value))));
        totalsView();
    };
    function totalsView() {
        syncSkillControls();
        const panel = byId("characterTotals"), diffs = byId("setDifferences");
        const results = sets.map(set=>calculate(set));
        const stats = results.map(result=>result?.totals);
        const activeIndex = sets.indexOf(active), data = stats[activeIndex];
        panel.replaceChildren(element("strong",character.name+" · "+character.weapon+" · Lv."+level+" · 세트 "+active.id));
        if (!data) panel.append(element("p","장착 무기가 다릅니다. 실험체의 무기군을 바꾸거나 이 세트의 무기를 교체하세요."));
        else {
            const dl = element("dl");
            for (const [key,value] of Object.entries(data)) dl.append(element("dt",key),element("dd",statText(key,value,results[activeIndex].speedBonus)));
            panel.append(dl);
        }
        panel.append(element("h3","장착한 고유 효과"),equippedEffects(active,true));
        diffs.hidden = sets.length < 2;
        diffs.replaceChildren();
        renderSkills();
        if (diffs.hidden) return;
        const table = element("table"), header = table.createTHead().insertRow();
        header.append(element("th","스탯"),...sets.map((s,i)=>element("th","세트 "+s.id+(i===0?" (기준)":""))));
        const body = table.createTBody();
        for (const key of new Set(stats.flatMap(s=>Object.keys(s || {})))) {
            const row = body.insertRow(); row.append(element("th",key));
            stats.forEach((s,i)=>{
                const cell = row.insertCell();
                if (!s) { cell.textContent = "무기군 불일치"; return; }
                const value = s[key] || 0;
                cell.textContent = statText(key,value,results[i].speedBonus);
                if (i && stats[0]) {
                    const delta = Number((value-(stats[0][key] || 0)).toFixed(3));
                    if (key === "공격 속도") {
                        const bonusDelta = Number((results[i].speedBonus-results[0].speedBonus).toFixed(3));
                        const signed = n => (n>0?"+":"")+fmt(n);
                        cell.append(element("span"," ("+signed(bonusDelta)+"%p, "+signed(delta)+")"));
                        return;
                    }
                    const rateDiff = cooldownRate(value) - cooldownRate(stats[0][key] || 0);
                    const rateText = key === "쿨다운 감소" ? ", "+(rateDiff>0?"+":"")+fmt(rateDiff)+"%p" : "";
                    cell.append(element("span"," ("+(delta>0?"+":"")+fmt(delta)+rateText+")",delta>0?"positive":delta<0?"negative":""));
                }
            });
        }
        const effectsRow = body.insertRow();
        effectsRow.append(element("th","장착한 고유 효과"));
        for (const set of sets) effectsRow.insertCell().append(equippedEffects(set,false));
        diffs.append(element("h2","세트별 스탯 비교"),table);
    }
    const adjustmentInputs = new Map();
    for (const name of ["체력","방어력","공격력","스킬 증폭","공격 속도","이동 속도"]) {
        const label = element("label", name + (["공격 속도","이동 속도"].includes(name) ? " (%)" : ""));
        const input = element("input");
        input.type = "number";
        input.step = "any";
        input.placeholder = "0";
        input.oninput = () => {
            active.adjustments[name] = Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : 0;
            totalsView();
        };
        label.append(input);
        byId("adjustmentFields").append(label);
        adjustmentInputs.set(name,input);
    }
    function render() {
        for (const [name,input] of adjustmentInputs) input.value = active.adjustments[name] || "";
        characters();
        equipment();
        totalsView();
    }
    byId("compareToggle").onclick = () => {
        const opening = !document.body.classList.contains("comparing");
        if (opening) returnScroll = window.scrollY;
        document.body.classList.toggle("comparing",opening);
        byId("compareToggle").textContent = opening ? "계산기로 돌아가기" : "아이템 스탯 비교";
        byId("compareToggle").setAttribute("aria-expanded",opening);
        hideTooltip();
        if (opening) render();
        window.scrollTo(0, opening ? 0 : returnScroll);
    };
    byId("routeResults").addEventListener("click",event=>{
        const b = event.target.closest(".register-set");
        if (!b) return;
        const gear = {};
        for (const idx of b.dataset.gear.split(",")) {
            const item = heroes[Number(idx)];
            gear[slotOf(item)] = item;
        }
        if (sets.length === 1 && !Object.keys(active.gear).length) {
            active.gear = gear;
            if (gear["무기"]) character = variants.find(v=>v.weapon===gear["무기"].slot) || character;
        } else addSet(gear);
        b.textContent = "세트 "+active.id+" 등록됨";
    });
    byId("newSet").onclick = () => {addSet(); render();};
    byId("characterQuery").oninput = characters;
    byId("gearQuery").oninput = gearPicker;
    byId("compareRarity").onchange = gearPicker;
    for (let n=1;n<=20;n++) byId("compareLevel").add(new Option(n,n));
    byId("compareLevel").onchange = e => {level=Number(e.target.value); totalsView();};
})();
