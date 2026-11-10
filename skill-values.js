/* Skill sheets use slash-separated ranks and additive, parenthesized coefficients. */
function evaluateSkillLine(line, rank, values) {
    // Normalize equivalent notations used by different saved character sheets.
    const original = line;
    const timed = line.match(/^(쿨다운|시전 딜레이): ([\d.]+)초 \/ 실질 공격 속도$/);
    if (timed) {
        const speed = values["실질 공격 속도"];
        return {label:timed[1], result:speed > 0 ? Number((Number(timed[2])/speed).toFixed(2))+"초" : "—"};
    }
    line = line.replace(/^쿨다운\s*:\s*([\d.]+)초$/,"쿨다운 [$1]");
    line = line.replace(/(\)|\])\[\d+\]$/,"$1")
        .replace(/\[([^\[\]()]+?)의\s*([\d.%/\s]+)\]/g,"(+$1의 $2)")
        .replace(/(:\s*)([가-힣 ]+)의\s*([\d.]+%)(?=\s*(?:\*|$))/,"$1(+$2의 $3)");
    const first = line.match(/\[\s*[+-]?\d[\d.%\s/~-]*\]|\(\s*\+[^)]+\)/);
    if (!first) return null;
    const label = line.slice(0, first.index).trim();
    if (!label || label.length > 85) return null;
    const formula = line.slice(first.index).trim();
    const ranked = text => {
        const parts = text.split(/\s*\/\s*/);
        return parts[Math.min(rank, parts.length)-1].trim();
    };
    function part(expression) {
        let total = 0, percent = false;
        const unknown = [];
        let rest = expression.trim();
        const multiplier = rest.match(/\s*\*\s*\(([^()]+)\)\s*$/);
        if (multiplier) rest = rest.slice(0,multiplier.index).trim();
        const base = rest.match(/^\[([^\]]+)\]/);
        if (base) {
            const n = ranked(base[1]);
            if (!/^-?\d+(?:\.\d+)?%?$/.test(n)) return null;
            percent = n.endsWith("%");
            total = parseFloat(n);
            rest = rest.slice(base[0].length).trim();
        }
        while (rest) {
            const term = rest.match(/^\(((?:[^()]|\([^()]*\))+)\)/);
            if (!term) return null;
            const t = term[1].replace(/^\s*\+\s*/,"").trim();
            const ratio = t.match(/^(.+?)(?:의\s*|\s*\*\s*|\s+)([\d.]+%?(?:\s*\/\s*[\d.]+%?)*)$/);
            const per = t.match(/^(.+?)\s*(\d+(?:\.\d+)?)%?\s*당\s*([\d.]+)%?$/);
            if (per && Object.hasOwn(values,per[1].trim())) total += values[per[1].trim()] / Number(per[2]) * Number(per[3]);
            else if (ratio && Object.hasOwn(values,ratio[1].trim())) {
                const coefficient = ranked(ratio[2]);
                total += values[ratio[1].trim()] * parseFloat(coefficient) / (coefficient.endsWith("%") ? 100 : 1);
            } else if (Object.hasOwn(values,t)) total += values[t];
            else unknown.push(term[0]);
            rest = rest.slice(term[0].length).trim();
        }
        if (multiplier && multiplier[1] === "기본 공격 증폭" && !unknown.length) total *= 1+(values["기본 공격 증폭"] || 0)/100;
        const suffix = multiplier && (multiplier[1] !== "기본 공격 증폭" || unknown.length) ? " × ("+multiplier[1]+")" : "";
        if (values["표식 피해 배율"] && label==="피해량" && original.includes("치명타 확률의 50%")) {
            total = (total - values["치명타 확률"]*.5)*values["표식 피해 배율"];
        }
        if (label==="쿨다운") total *= (1-(values["공속 쿨다운 감소율"] || 0))*100/(100+(values["유효 스킬 가속"] || 0));
        if (label==="쿨다운" && values["공속 적용 쿨다운"] !== undefined) total = values["공속 적용 쿨다운"];
        if (label==="발사 수") total += values["추가 발사 수"] || 0;
        const formatted = label==="쿨다운" && Object.hasOwn(values,"공속 쿨다운 감소율")
            ? total.toLocaleString("ko",{maximumFractionDigits:2, roundingMode:"halfEven"})
            : Number(total.toFixed(2)).toLocaleString("ko");
        return [formatted+(percent?"%":label==="쿨다운"?"초":""),...unknown].join(" ")+suffix;
    }
    const results = formula.split(/\s*~\s*(?=\[|\()/).map(part);
    return results.every(x=>x!==null) ? {label, result:results.join(" ~ ")} : null;
}
