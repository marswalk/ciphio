let ngrams = {};
let currentNgramSize = 4;
let ngramsLoaded = false;
let evolutionRunning = false;

// --- N-GRAM LOADING & SCORING ---
function loadNgrams(size, callback) {
    ngramsLoaded = false;
    ngrams = {};
    currentNgramSize = size;

    fetch(`../ngrams/${size}gramScores.csv`)
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n');
            for (let line of lines) {
                const parts = line.trim().split(' ');
                if (parts.length >= 3) {
                    ngrams[parts[0]] = parseInt(parts[2]);
                }
            }
            ngramsLoaded = true;
            if (callback) callback();
        })
        .catch(err => {
            console.error("Failed to load n-grams", err);
        });
}

function ngramScore(text) {
    let score = 0;
    const size = currentNgramSize;
    for (let i = 0; i < text.length - (size - 1); i++) {
        const seq = text.substring(i, i + size);
        if (ngrams[seq]) {
            score += ngrams[seq];
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

// --- CORE ALGORITHM (AFFINE) ---
function modInverse(a) {
    for (let x = 1; x < 26; x++) {
        if ((a * x) % 26 === 1) return x;
    }
    return 1;
}

function decodeAffine(text, a, b) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let decoded = "";
    const a_inv = modInverse(a);

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const idx = alphabet.indexOf(char.toUpperCase());

        if (idx !== -1) {
            let newIdx = (a_inv * (idx - b)) % 26;
            if (newIdx < 0) newIdx += 26;

            if (char === char.toLowerCase()) {
                decoded += alphabet[newIdx].toLowerCase();
            } else {
                decoded += alphabet[newIdx];
            }
        } else {
            decoded += char;
        }
    }
    return decoded;
}

// --- UI HANDLERS & BRUTE FORCE ---
function startAffineCrack() {
    const form = document.forms["evolutionForm"];
    const message = form["message"].value;
    const selectedNgram = parseInt(document.getElementById("ngramSelect").value) || 4;

    if (!message) return;

    document.getElementById("startEvolutionButton").disabled = true;
    document.getElementById("stopEvolutionButton").disabled = false;
    document.getElementById("evolutionResult").innerHTML = "";

    loadNgrams(selectedNgram, () => {
        evolutionRunning = true;
        const cleanText = getCleanText(message);
        const startTime = Date.now();

        const a_values = [1,3,5,7,9,11,15,17,19,21,23,25];
        let keysToTest = [];
        for (let a of a_values) {
            for (let b = 0; b < 26; b++) {
                keysToTest.push({a, b});
            }
        }

        let bestGlobalScore = -Infinity;
        let bestGlobalKey = {a: 0, b: 0};
        let bestGlobalDecryption = "";
        let currentIndex = 0;

        function checkNextBatch() {
            if (!evolutionRunning || currentIndex >= keysToTest.length) {
                document.getElementById("startEvolutionButton").disabled = false;
                document.getElementById("stopEvolutionButton").disabled = true;
                evolutionRunning = false;
                return;
            }

            // Process a chunk of keys per frame to create the visual "thinking" effect
            let batchLimit = 15;
            let foundImprovement = false;

            while (currentIndex < keysToTest.length && batchLimit > 0) {
                let key = keysToTest[currentIndex];
                let decodedCleanText = decodeAffine(cleanText, key.a, key.b);
                let score = ngramScore(decodedCleanText);

                if (score > bestGlobalScore) {
                    bestGlobalScore = score;
                    bestGlobalKey = key;
                    bestGlobalDecryption = decodeAffine(message, key.a, key.b);
                    foundImprovement = true;
                }

                currentIndex++;
                batchLimit--;
            }

            if (foundImprovement) {
                const timeElapsed = Date.now() - startTime;

                const bestKeyEl = document.getElementById("bestKey");
                const bestKeyTimeFoundEl = document.getElementById("bestKeyTimeFound");
                const bestDecryptionEl = document.getElementById("bestDecryption");

                if(bestKeyEl) bestKeyEl.textContent = `A=${bestGlobalKey.a}, B=${bestGlobalKey.b}`;
                if(bestKeyTimeFoundEl) bestKeyTimeFoundEl.textContent = timeElapsed + "ms";
                if(bestDecryptionEl) bestDecryptionEl.textContent = bestGlobalDecryption;

                const list = document.getElementById("evolutionResult");
                const li = document.createElement("li");
                li.style.padding = "10px";
                li.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                li.innerHTML = `<strong>Tested ${currentIndex}/312 keys</strong> | Score: ${bestGlobalScore} | Time: ${timeElapsed}ms<br>
                                <span style="color: var(--primary-color)">Key: (A=${bestGlobalKey.a}, B=${bestGlobalKey.b})</span><br>
                                <em>${bestGlobalDecryption.substring(0, 80)}...</em>`;
                list.prepend(li);
            }

            // Yield to browser to create a tiny visual delay
            setTimeout(() => requestAnimationFrame(checkNextBatch), 5);
        }

        checkNextBatch();
    });
}

function stopEvolution() {
    evolutionRunning = false;
    document.getElementById("startEvolutionButton").disabled = false;
    document.getElementById("stopEvolutionButton").disabled = true;
}

document.addEventListener("DOMContentLoaded", function () {
    if (typeof dataText !== 'undefined') {
        dataText = [
            ["title", "Affine Cipher"],
            ["subtitle", "Hecking by Marswalk in Belgium :)"]
        ];
    } else {
        window.dataText = [
            ["title", "Affine Cipher"],
            ["subtitle", "Hecking by Marswalk in Belgium :)"]
        ];
    }
    if (typeof startTextAnimation === "function") startTextAnimation(0);
    if (typeof setupExpandInfo === "function") setupExpandInfo();

    const startBtn = document.getElementById("startEvolutionButton");
    const stopBtn = document.getElementById("stopEvolutionButton");
    const testBtn = document.getElementById("testTextButton");
    
    if (startBtn) startBtn.addEventListener("click", startAffineCrack);
    if (stopBtn) stopBtn.addEventListener("click", stopEvolution);
    if (testBtn) testBtn.addEventListener("click", () => {
        document.getElementById("evolutionMessage").value = "RIPPYWIQNAPCXIVXWIQPCILLYVAZUEPCORYWRIJCNCCVCTWLCXZAZRCIPSRICALAMWUZUXWXWXAUAQCZRWVMZAEFUCZUAQCAVCWIQPCILLYPCILLYRAFWVMZRIZAEPAJCPLAPXUOWLLHWVXUAQCZRWVMINWZQAPCPCLCJIVZHAPQCZAZISGLCUAAVZRCMPAEFRCPCWUMPCIZNEZWZHCCLULWGCZRCPCWUIXWQWVWURWVMPCZEPVAVNPCIGWVMOOWWSWFRCPUUCJCVZYUWTYCIPUAVIVXCJCVZRCSALXOIPHWILGIWVZCPSCFZFWLCXACUVZUCCQZANCMWJWVMQESRNISGWHYAEXAVZRIJCIVYZRWVMHAPQCZAOAPGAVZRCVQIYNCYAESAELXUCVXAJCPUAQCVCONWCUHAPQCZAZPIWVEFOCPCSCWJCXIUZISGAHQIZCPWILHPAQLAVXAVISAEFLCAHOCCGUIMAZRIZQWMRZQIGCIMAAXCTCPSWUCHAPZRCQIVXORWLCZRCHWPUZHCOZCTZUIPCPCLIZWJCLYUWQFLCWZOAELXNCIMAAXCTCPSWUCHAPYAEVMIVILYUZUZAZPYZAOAPGAEZORIZZRCYIPCZCLLWVMEUWRIJCIZZISRCXZRCHWPUZWZCQHPAQZRCNIZSRUAYAESIVUCCORIZWQCIVWOAELXJCPYXCIPLYLWGCZAGVAOORIZZRCMPCIZQIZZCPPCHCPUZAIVXWUEUFCSZYAEOWLLOIVZZAGVAOZAAZRCPCSPEWZUXAVZVCCXZAGVAOQESRZANPCIGZRWUAVCWHZRCYRIJCXAVCAEPWVXESZWAVZPIWVWVMAVNIUWSSWFRCPUZRCYURAELXNCHWVCQYSALLCIMECURCPCRIJCVWSGVIQCXZRWUHWLCZRCLWMRZRAEUCSAVUFWPISYNCSIEUCAHORCPCZRCFIFCPUOCPCHAEVXZRIZQIGCUWZUAEVXILAZQAPCWQFPCUUWJCZRIVWZHWPUZLAAGUNEZYAEVCJCPGVAOORCPCUAQCZRWVMLWGCZRWUQWMRZLCIXWRIJCUCZEFIUCSEPCAVLWVCUYUZCQUAZRCZPIWVCCUSIVMCZISSCUUZASIUCHWLCUIVXUCVXQCZRCWPIZZCQFZUIZXCSWFRCPWVMWHYAEFAWVZZRCQZRCPCZRCVWOWLLSRCSGRAOZRCYIPCMCZZWVMAVQIYNCZRCYSAELXLAAGIZZRCNAUUSAXCNPCIGWVMMEWXCIUOCLLWHZRCYVCCXZANPEUREFZRCWPUGWLLUILLZRCNCUZBAXWC";
    });
});
