let ngrams = {};
let currentNgramSize = 4;
let ngramsLoaded = false;
let evolutionRunning = false;

// --- N-GRAM LOADING & SCORING ---
function loadNgrams(size, callback) {
    ngramsLoaded = false;
    ngrams = {};
    fetch(`../ngrams/${size}gramScores.csv`)
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n');
            for (let line of lines) {
                if (line.trim() === "") continue;
                const parts = line.trim().split(' ');
                if (parts.length >= 3) {
                    ngrams[parts[0]] = parseInt(parts[2]);
                }
            }
            ngramsLoaded = true;
            if (callback) callback();
        })
        .catch(error => {
            console.error("Error loading n-grams:", error);
            alert("Failed to load N-Gram data.");
        });
}

function ngramScore(text) {
    let score = 0;
    for (let i = 0; i <= text.length - currentNgramSize; i++) {
        const chunk = text.substring(i, i + currentNgramSize);
        if (ngrams[chunk] !== undefined) {
            score += ngrams[chunk];
        } else {
            score -= 3000;
        }
    }
    return score;
}

// --- UTILITIES ---
function getCleanText(text) {
    return text.toUpperCase().replace(/[^A-Z]/g, '');
}

// --- CORE ALGORITHM (RAIL FENCE) ---
function decodeRailFence(text, key) {
    if (key < 2) return text;
    
    // Calculate chunks length
    let chunks = new Array(key).fill(0);
    let rail = 0;
    let inc = 1;
    for (let i = 0; i < text.length; i++) {
        chunks[rail]++;
        rail += inc;
        if (rail === 0 || rail === key - 1) inc *= -1;
    }
    
    // Rebuild fence
    let fence = new Array(key).fill("");
    let ctr = 0;
    for (let i = 0; i < key; i++) {
        fence[i] = text.substring(ctr, ctr + chunks[i]);
        ctr += chunks[i];
    }
    
    // Read off fence
    rail = 0;
    inc = 1;
    let out = "";
    for (let i = 0; i < text.length; i++) {
        out += fence[rail][0];
        fence[rail] = fence[rail].substring(1);
        rail += inc;
        if (rail === 0 || rail === key - 1) inc *= -1;
    }
    
    return out;
}

// --- UI HANDLERS & BRUTE FORCE ---
let bestGlobalScore = -Infinity;
let bestGlobalKey = 0;
let bestGlobalDecryption = "";
let startTime = 0;

function updateBestUI() {
    if (document.getElementById("bestKey")) document.getElementById("bestKey").innerText = bestGlobalKey;
    document.getElementById("bestDecryption").innerText = bestGlobalDecryption;
    let timeLapsed = (Date.now() - startTime) / 1000;
    if (document.getElementById("bestKeyTimeFound")) document.getElementById("bestKeyTimeFound").innerText = timeLapsed.toFixed(2) + "s";
    
    const historyList = document.getElementById("evolutionHistory");
    const li = document.createElement("li");
    li.innerText = `[${timeLapsed.toFixed(2)}s] Rails: ${bestGlobalKey} (Score: ${bestGlobalScore.toFixed(2)}): ${bestGlobalDecryption.substring(0, 80)}...`;
    historyList.prepend(li);
}

async function startRailFenceCrack() {
    const form = document.forms["evolutionForm"];
    const message = getCleanText(form["message"].value);
    const maxRails = parseInt(form["maxRails"].value);
    const selectedNgramSize = parseInt(form["ngramSelect"].value);
    
    if (message.length < 5) {
        alert("Please enter a longer ciphertext.");
        return;
    }
    
    document.getElementById("startEvolutionButton").disabled = true;
    document.getElementById("stopEvolutionButton").disabled = false;
    document.getElementById("evolutionHistory").innerHTML = "";
    document.getElementById("bestDecryption").textContent = message;
    
    evolutionRunning = true;
    bestGlobalScore = -Infinity;
    startTime = Date.now();
    
    if (selectedNgramSize !== currentNgramSize || !ngramsLoaded) {
        currentNgramSize = selectedNgramSize;
        await new Promise(resolve => loadNgrams(currentNgramSize, resolve));
    }
    
    let currentRail = 2;
    
    function step() {
        if (!evolutionRunning) return;
        
        let currentDecryption = decodeRailFence(message, currentRail);
        let currentScore = ngramScore(currentDecryption);
        
        if (currentScore > bestGlobalScore) {
            bestGlobalScore = currentScore;
            bestGlobalKey = currentRail;
            bestGlobalDecryption = currentDecryption;
            updateBestUI();
        }
        
        if (document.getElementById("currentIteration")) document.getElementById("currentIteration").innerText = currentRail;
        
        currentRail++;
        if (currentRail <= maxRails && currentRail <= message.length && evolutionRunning) {
            // Visual delay chunking for aesthetic feed
            requestAnimationFrame(step);
        } else {
            evolutionRunning = false;
            document.getElementById("startEvolutionButton").disabled = false;
            document.getElementById("stopEvolutionButton").disabled = true;
        }
    }
    
    requestAnimationFrame(step);
}

function stopEvolution() {
    evolutionRunning = false;
    document.getElementById("startEvolutionButton").disabled = false;
    document.getElementById("stopEvolutionButton").disabled = true;
}

document.addEventListener("DOMContentLoaded", function () {
    const startBtn = document.getElementById("startEvolutionButton");
    const stopBtn = document.getElementById("stopEvolutionButton");
    const testBtn = document.getElementById("testTextButton");
    
    if (startBtn) startBtn.addEventListener("click", startRailFenceCrack);
    if (stopBtn) stopBtn.addEventListener("click", stopEvolution);
    if (testBtn) testBtn.addEventListener("click", () => {
        document.getElementById("evolutionMessage").value = "HBIYWBERGIHSNLYHEIOARFANPRTKSSUAISINTAITSOGKNYRKAOONOAESARNOGGGCHIRXLSWGCOYYUELAHRRTCAWYIWGTSUUTORTNOIHODRNPYEOSEELHOYOHWDEDEITOUOOLMDTRSTETOEDAAEOHTLWGNEOBBGEYRESEAMODALNEHEELDACOIDDTIPEOEALLHTAVRWLSMGBEETOTCOTUHGEIFIEIAIHTREKICSESXOANHWRANPPENTBNMCIOTNTOMROMYCUDVEEFRRIRCATMTFOOAEFAOIHAORITEHLISETEAYITOAORIYULSRTOTHYLIHVCEISFOACUAHTIORDLKOWERTERTSSOWNTTOCUNNKOTBHSTEDNNUTAOBIHESBFCLEHVNMDIEGTCNCBEFTESENTKSNARISVIFOKONNWSMGISIAIEUUEEYOHNEEATCLSNMRTSTHRYUTEEHLCOTEEOMHYLOEOERGUWLENBUHILABSERARNMLORYVEITEHLSIOENUTEIEYLOGTOLSLDENIRLNROKOHOESATELTEDNIENRIWIRVYYSNEEDFKTEIOTMEIUAFDHAHFEONNBULNEMWSMTNEEDAFELMDCLWSTMTEOESRMWEFTTSRTLMIUEOESRNATTOKWTAENIEADFTMMBHONWINUEEYENHHEAREOIPYIAOWTEIOEOWHRTOFYEEICNIGACEHHDIYLUEAIATFTIHESAESWEPRRUHAIULOMSENILSYEKWEENKIGEHSPCONSSEISGCSAIAEEITTDPIFPTMREIHHHRTGATCDKHSDENISLHEOSTRLLETIRIEARATUIANXOHAOTDSMGOSMARRAPNORODFNTITOEAMTLSERRITUESHRIINROBNWPEETERDVCLILECLDSEGVCBYUAEIGTWTEEODEROBEEOUWIECORALNOPEKHTMKDXEOADTEFWAEIEPELBDXEOGNSOWRHTRTGSATTEIETESYSEMALVALTKATAMRFADETLWKOHRTDETMCEKNIHVORTONNSCRTOLNMEGRHCNHSHLOSPRCUHRAEEOAMTOOMPETARTBTVRHRTIEHHLAEAENITMTACNCSSFNSTEEPEINIONTENWEKEATNYEOLATSOAIDAITETHPSILHJDYDESHETESOTOMEIURIHMVEEGEBLEMGNGHNAEOAREEIHOVNOHYSSITPVKIOUEAAEFNHERVLDEFATOAEUTHTHOEEDROTTENCLNESDUAEAUIIISUEAEKIEUIAEPFTSTRHSUEEHTTVSLERAEEDHMCGIHICYIBUTCKEFDUKTO";
    });
});
