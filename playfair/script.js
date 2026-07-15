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
    let clean = text.toUpperCase().replace(/[^A-Z]/g, '');
    clean = clean.replace(/J/g, 'I');
    if (clean.length % 2 !== 0) clean += 'X';
    return clean;
}

// --- CORE ALGORITHM (PLAYFAIR) ---
function decodePlayfair(text, key) {
    let out = "";
    for (let i = 0; i < text.length; i += 2) {
        let a = text[i];
        let b = text[i+1];
        
        let pA = key.indexOf(a);
        let pB = key.indexOf(b);
        
        if (pA === -1) pA = key.indexOf('X'); // fallback
        if (pB === -1) pB = key.indexOf('X');
        
        let rA = Math.floor(pA / 5), cA = pA % 5;
        let rB = Math.floor(pB / 5), cB = pB % 5;
        
        if (rA === rB) {
            out += key[rA * 5 + (cA + 4) % 5];
            out += key[rB * 5 + (cB + 4) % 5];
        } else if (cA === cB) {
            out += key[((rA + 4) % 5) * 5 + cA];
            out += key[((rB + 4) % 5) * 5 + cB];
        } else {
            out += key[rA * 5 + cB];
            out += key[rB * 5 + cA];
        }
    }
    return out;
}

function generateRandomKey() {
    let alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ".split("");
    for (let i = alphabet.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [alphabet[i], alphabet[j]] = [alphabet[j], alphabet[i]];
    }
    return alphabet.join("");
}

function mutateKey(key) {
    let k = key.split("");
    let rnd = Math.random();
    if (rnd < 0.90) {
        // Swap 2 letters
        let i = Math.floor(Math.random() * 25);
        let j = Math.floor(Math.random() * 25);
        [k[i], k[j]] = [k[j], k[i]];
    } else if (rnd < 0.93) {
        // Swap rows
        let r1 = Math.floor(Math.random() * 5);
        let r2 = Math.floor(Math.random() * 5);
        for(let c=0; c<5; c++) {
            [k[r1*5+c], k[r2*5+c]] = [k[r2*5+c], k[r1*5+c]];
        }
    } else if (rnd < 0.96) {
        // Swap cols
        let c1 = Math.floor(Math.random() * 5);
        let c2 = Math.floor(Math.random() * 5);
        for(let r=0; r<5; r++) {
            [k[r*5+c1], k[r*5+c2]] = [k[r*5+c2], k[r*5+c1]];
        }
    } else if (rnd < 0.98) {
        // Reverse
        k.reverse();
    } else {
        // Mirror rows
        for(let r=0; r<2; r++) {
            let rOpp = 4 - r;
            for(let c=0; c<5; c++) {
                [k[r*5+c], k[rOpp*5+c]] = [k[rOpp*5+c], k[r*5+c]];
            }
        }
    }
    return k.join("");
}

// --- UI HANDLERS & HILL CLIMBING ---
let bestGlobalScore = -Infinity;
let bestGlobalKey = "";
let bestGlobalDecryption = "";
let startTime = 0;

function updateBestUI() {
    if (document.getElementById("bestKey")) document.getElementById("bestKey").innerText = bestGlobalKey;
    document.getElementById("bestDecryption").innerText = bestGlobalDecryption;
    let timeLapsed = (Date.now() - startTime) / 1000;
    if (document.getElementById("bestKeyTimeFound")) document.getElementById("bestKeyTimeFound").innerText = timeLapsed.toFixed(2) + "s";
    
    const historyList = document.getElementById("evolutionHistory");
    const li = document.createElement("li");
    li.innerText = `[${timeLapsed.toFixed(2)}s] Key "${bestGlobalKey}" (Score: ${bestGlobalScore.toFixed(2)}): ${bestGlobalDecryption.substring(0, 80)}...`;
    historyList.prepend(li);
}

async function runHillClimbRound(text, round) {
    let currentKey = generateRandomKey();
    let currentDecryption = decodePlayfair(text, currentKey);
    let currentScore = ngramScore(currentDecryption);
    
    let maxIterations = 2500;
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
                let nextDecryption = decodePlayfair(text, nextKey);
                let nextScore = ngramScore(nextDecryption);
                
                if (nextScore > currentScore) {
                    currentScore = nextScore;
                    currentKey = nextKey;
                    currentDecryption = nextDecryption;
                    iterationsSinceLastImprovement = 0;
                    
                    if (currentScore > bestGlobalScore) {
                        bestGlobalScore = currentScore;
                        bestGlobalKey = currentKey;
                        bestGlobalDecryption = currentDecryption;
                        updateBestUI();
                    }
                } else {
                    iterationsSinceLastImprovement++;
                }
                iteration++;
            }
            if (document.getElementById("currentRound")) document.getElementById("currentRound").innerText = round;
            if (document.getElementById("currentIteration")) document.getElementById("currentIteration").innerText = iteration;
            requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    });
}

async function startPlayfairCrack() {
    const form = document.forms["evolutionForm"];
    const message = getCleanText(form["message"].value);
    const numRounds = parseInt(form["roundinput"].value);
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
    
    for (let round = 1; round <= numRounds; round++) {
        if (!evolutionRunning) break;
        await runHillClimbRound(message, round);
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
    
    if (startBtn) startBtn.addEventListener("click", startPlayfairCrack);
    if (stopBtn) stopBtn.addEventListener("click", stopEvolution);
    if (testBtn) testBtn.addEventListener("click", () => {
        document.getElementById("evolutionMessage").value = "BOAZNDSBACNMKCRABKROMKMSQCANLTZMGUYBFBOXICIUGMIUESKCPRPDIMMDBOFMPMIKTLTBKBKBAPNOKLBFYQPRVLLILTNOFMMGSBOMIMSUQCMKMSQCFHSFYQPDRSMVMNUFMTNMBTXGSUPEGABTNOKLBFYQBIKSONMKMKULXORQPHMOKLRPMBETILAVNAPDFIMNVLCFMKSXKNIMSDZLKSGFLUTPKEKLCFMKSXRBEAGASXBFYQMKLZMANADAIMEKYQXZXGEBFSCFATLIUFRQBQSACGRMPAARRYFUGMPDLEMPYZRMGKMSIRGALKMDFLLQESKCMFQALTIULCPRCIIKXFYQCMHYIBDEKGHNZCNAPDOXIMYGPDGAIGNMCLPRVNDTNAPDGMORBDGCMVHMMUBTGMHRUFATNOGMGUISILPHMOKLRPMRGAVLUGMKELFXKCBXSRDEHPORLKAKMSKONOPMRYNAMBMVQPFMGVIUFEXBFNPDRSAEFYLRRIIMFNRHIUKMBELIPHDZCFORRYVYESKLCFGKATPKGULKZSXBMKMKSMSKUFQCXSOLULKSVNMUCDIMFNRHIUKMBELIPHNDMVYQRAMSBQLTPRZDDQNVNMFRZLVYRSPDGCRMKLLUSEYQXLFBOXIMSZSRHYKCPDFGKATLKSLCKONOPDICRSHYPAHNMERALIGUBOSKCLRAGXMVTCUFNDCKRMQCSEEFPRGRNVVYRSPDFIMKRSORSZLKAZMKGFATPRRABKLXTQLEQDMVXGSUQURASZPRGRNVPRRPCFMKDMXELTHRRQMGKCPRGRNVCMHYPRDAIMTZBFPAMGKGPDGCBOUFHRMGMVAKRYMESKNAZDBSAGYQNAIBXSBUBEVFKMTLCFBQFHMUCDFGGALCBHMPULNIMLPBKMFCOXGMEBGRROKCPDSXGKULPDLUKIDPFHXLLENATQKAMBBDLEMXLIHPVYKMKLCFSOLFATUGMKPHWMKZBOLRRIILKSPAWMBRPMLRNMFKOLMKXAXSUFPDRAKSGKATLPAVRFXIZLHNWMFUKMGRNVVYKMILNOKLBFYQSEEFPDSXAEFYLPIMBKBOUFLILZSOLIEMMKNASEMGQBTLLCPAPDKLMRGAIUILBMYQKLMBELXATLMHBXFGESILRABTGMCRKLCFKARSLKOLLTRSCKBEVFKMGAIKGHMVVHGASZPDLCPDKMKLCFAGXGSUUECFDEFHZQCFBNMKIFSZSKYQNAORBDKLCFBHMVTCPMRFRSPDICAPLBRHICMKRIGAIWEWKBIMQXLUSEKPCFGYIUKCPRDAXLCVQLCFKATIESPTMSPLCFCITLFABKKU";
    });
});
