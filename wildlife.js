(() => {
    const animals = {
        chicken: ["닭", "Chicken"], bat: ["박쥐", "Bat"], dog: ["들개", "Dog"],
        boar: ["멧돼지", "Boar"], wolf: ["늑대", "Wolf"],
        bear: ["곰", "Bear"], drone: ["드론", "AttackDrone"]
    };
    const mapToggle = document.getElementById("mapWildlifeToggle");
    const routeToggle = document.getElementById("routeWildlifeToggle");
    const layer = document.createElement("div");
    layer.className = "wildlife-layer";
    layer.hidden = true;
    function icon(animal) {
        const img = document.createElement("img");
        img.src = "img/야생동물/" + animals[animal][1] + ".png";
        img.alt = animals[animal][0];
        return img;
    }
    for (const spawn of wildlifeSpawns) {
        const marker = document.createElement("span");
        marker.className = "wildlife-marker" + (spawn.isMutant ? " mutant" : "");
        marker.style.left = spawn.left + "%";
        marker.style.top = spawn.top + "%";
        marker.title = spawn.area + " · " + (spawn.isMutant ? "변이 " : "") + animals[spawn.animal][0] + " " + spawn.count + "마리";
        const count = document.createElement("small");
        count.textContent = spawn.count;
        marker.append(icon(spawn.animal), count);
        layer.append(marker);
    }
    document.getElementById("mapFrame").append(layer);
    mapToggle.onchange = () => { layer.hidden = !mapToggle.checked; };
    const counts = {};
    for (const spawn of wildlifeSpawns) {
        if (spawn.isMutant || !["chicken","bat","dog","boar","wolf"].includes(spawn.animal)) continue;
        counts[spawn.area] ??= {};
        counts[spawn.area][spawn.animal] = (counts[spawn.area][spawn.animal] || 0) + spawn.count;
    }
    function updateCounts() {
        for (const row of document.querySelectorAll(".route-wildlife")) {
            row.hidden = !routeToggle.checked;
            row.replaceChildren();
            if (!routeToggle.checked) continue;
            for (const animal of ["chicken","bat","dog","boar","wolf"]) {
                const entry = document.createElement("span");
                entry.title = animals[animal][0] + " (일반)";
                entry.append(icon(animal), ": " + (counts[row.dataset.area]?.[animal] || 0) + "마리");
                row.append(entry);
            }
        }
    }
    routeToggle.onchange = updateCounts;
    new MutationObserver(updateCounts).observe(document.getElementById("routeResults"), {childList:true});
})();
