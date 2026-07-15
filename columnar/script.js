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

// --- CORE ALGORITHM (COLUMNAR) ---
function decodeColumnar(text, P) {
    const C = P.length;
    const N = text.length;
    const longColsCount = N % C;
    const shortColLen = Math.floor(N / C);
    const longColLen = shortColLen + 1;
    
    // Split ciphertext into columns
    let cols = [];
    let ctr = 0;
    for (let i = 0; i < C; i++) {
        const origColIdx = P[i];
        const colLen = (longColsCount === 0 || origColIdx < longColsCount) ? longColLen : shortColLen;
        cols[origColIdx] = text.slice(ctr, ctr + colLen);
        ctr += colLen;
    }
    
    // Read row by row
    let out = "";
    for (let r = 0; r < longColLen; r++) {
        for (let c = 0; c < C; c++) {
            if (cols[c] && r < cols[c].length) {
                out += cols[c][r];
            }
        }
    }
    return out;
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function generateRandomKey(C) {
    let key = [];
    for (let i = 0; i < C; i++) key.push(i);
    return shuffle(key);
}

function mutateKey(key) {
    let newKey = [...key];
    const idx1 = Math.floor(Math.random() * key.length);
    let idx2 = Math.floor(Math.random() * key.length);
    while (idx1 === idx2) idx2 = Math.floor(Math.random() * key.length);
    [newKey[idx1], newKey[idx2]] = [newKey[idx2], newKey[idx1]];
    return newKey;
}

// --- UI HANDLERS & HILL CLIMBING ---
let bestGlobalScore = -Infinity;
let bestGlobalWidth = 0;
let bestGlobalKey = [];
let bestGlobalDecryption = "";
let startTime = 0;

function updateBestUI() {
    if (document.getElementById("bestWidth")) document.getElementById("bestWidth").innerText = bestGlobalWidth;
    if (document.getElementById("bestKey")) document.getElementById("bestKey").innerText = "[" + bestGlobalKey.join(", ") + "]";
    document.getElementById("bestDecryption").innerText = bestGlobalDecryption;
    let timeLapsed = (Date.now() - startTime) / 1000;
    if (document.getElementById("bestKeyTimeFound")) document.getElementById("bestKeyTimeFound").innerText = timeLapsed.toFixed(2) + "s";
    
    const historyList = document.getElementById("evolutionHistory");
    const li = document.createElement("li");
    li.innerText = `[${timeLapsed.toFixed(2)}s] Width ${bestGlobalWidth} (Score: ${bestGlobalScore.toFixed(2)}): ${bestGlobalDecryption.substring(0, 80)}...`;
    historyList.prepend(li);
}

async function runHillClimbRound(text, width, round) {
    let currentKey = generateRandomKey(width);
    let currentDecryption = decodeColumnar(text, currentKey);
    let currentScore = ngramScore(currentDecryption);
    
    let maxIterations = 2000;
    let iterationsSinceLastImprovement = 0;
    let iteration = 0;
    
    return new Promise(resolve => {
        function step() {
            for (let i = 0; i < 500; i++) {
                if (!evolutionRunning || iterationsSinceLastImprovement > maxIterations) {
                    resolve();
                    return;
                }
                
                let nextKey = mutateKey(currentKey);
                let nextDecryption = decodeColumnar(text, nextKey);
                let nextScore = ngramScore(nextDecryption);
                
                if (nextScore > currentScore) {
                    currentScore = nextScore;
                    currentKey = nextKey;
                    currentDecryption = nextDecryption;
                    iterationsSinceLastImprovement = 0;
                    
                    if (currentScore > bestGlobalScore) {
                        bestGlobalScore = currentScore;
                        bestGlobalWidth = width;
                        bestGlobalKey = [...currentKey];
                        bestGlobalDecryption = currentDecryption;
                        updateBestUI();
                    }
                } else {
                    iterationsSinceLastImprovement++;
                }
                iteration++;
            }
            if (document.getElementById("currentRound")) document.getElementById("currentRound").innerText = `W:${width} R:${round}`;
            if (document.getElementById("currentIteration")) document.getElementById("currentIteration").innerText = iteration;
            requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    });
}

async function startColumnarCrack() {
    const form = document.forms["evolutionForm"];
    const message = getCleanText(form["message"].value);
    const numRounds = parseInt(form["roundinput"].value);
    const maxWidth = parseInt(form["maxLength"].value);
    const selectedNgramSize = parseInt(form["ngramSelect"].value);
    
    if (message.length < 10) {
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
    
    for (let width = 2; width <= maxWidth; width++) {
        if (!evolutionRunning) break;
        for (let round = 1; round <= numRounds; round++) {
            if (!evolutionRunning) break;
            await runHillClimbRound(message, width, round);
        }
    }
    
    evolutionRunning = false;
    document.getElementById("startEvolutionButton").disabled = false;
    document.getElementById("stopEvolutionButton").disabled = true;
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
    
    if (startBtn) startBtn.addEventListener("click", startColumnarCrack);
    if (stopBtn) stopBtn.addEventListener("click", stopEvolution);
    if (testBtn) testBtn.addEventListener("click", () => {
        document.getElementById("evolutionMessage").value = "RBNEOWVETRLSOHUOILLITESIEARVRAOGERTLTSNGNAWHVISEEAKRISMIUKDVHROHBONSWOTPESFIMNLETGEESHWHTXRVMWEESOATOUTENAAHTRBONANDEINTETENPUANTRODWOTEYOIIINCSHEYAEEAITHEIEOEPRDASLESHIOYEWONTGDSSOSSRSTSEADIMDEFIMTICHGGBCOHCEGSFERTKLEIAMARNEANDAOTDTOSEAAPAVDFMGOEOTSEHGUEEIINREWPESRDHWLEPEEGMCUATOWTYCEREFOUCAOROOPEOIKDITDTSEEIITBDIYNSTOTRIHTTSFESAHALDLKARTFASOWKOCDEOTKNEDRTAOCRSBMEHVNHEGSPBERAENMTARETFOTVWSIEIAEAEEMTEESSSNEETHIOEEWETENYYLTSRGAINBPSABDYRILSYBITHGIONSEMYYGULIDHIRNEKNOEATLEDSENIIRNYNEOFIEETOIHFNANEKNYLOMIMAEVAALOCOSATGEFMIFESLLLUGEFNYTOWEEUEHFTMTOEIWEREWHTRSICITWEITOURIFAEDNIAPHUIOUEIEFEHOAAWHRFHEUTMINSSUKEELITHTCLSTIACOIDEATCIOTHELHYTNTUKBDKIEHDSELTTRODATHEXOCODSIPMALLNORWNTBEAMCORREISHAIROKIEEXOVCRACLNTVCIOEIMREEUDOBRRWITMALAEKHHAXEEHEFTEEPOAXEULOWTHTGVCEIOAYSTIVAKOTAERDEWNOHUNTMBHIHNNONBITOFCGRNMSHTCRCFTEETKOOISARKORHMGHHIEENYOACATFNMRPERYNTHLKEEOEOOEOAUWTEUHILSEHADMYRHEEEESIETTNEEOHORLONMLFOEHPSBEKEMIURGISYANTDATTOEEGAOHYFONAUSENSTNEDKERDUWGMAOCRNERTRTSIDOCRATYKAALITDRMHHCWEUYYOHGAEOUYLOOESENHAOHEUCRGIEYDELSAKTLIUSYSEPWUTIDORETLUEOEHKMEVPRNEEEGEAEEHTAPGPHRIHWRIAEDTSBNELYOURSEOIEALUIELHAIDMGEORRHTROLSITETTLTUITFIRIHTBNCSTEANLINPDSBNBYTNGTOMODVEEEIRECTFNOFATMOROALIWAAYELOROGSRRHYLSAEIETCUEMORLTWEMRTSTLTTRTNKCESTVOUTNSHELNLEHCDILONCUHESOASNMPVITBNNRTISLAUUITHNNCCLSTTSINUTENCOATMHLAOEIDLETHILHJ";
    });
});
