let ngrams = {};
let currentNgramSize = 4;
let ngramsLoaded = false;
let evolutionRunning = false;
let bestGlobalScore = -Infinity;
let bestGlobalKey = "";
let bestGlobalDecryption = "";

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

function decodeSubstitution(text, key) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let decoded = "";
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const idx = key.indexOf(char);
        if (idx !== -1) {
            decoded += alphabet[idx];
        } else {
            decoded += char;
        }
    }
    return decoded;
}

// --- UTILITIES ---
function getCleanText(text) {
    return text.toUpperCase().replace(/[^A-Z]/g, '');
}

// --- CORE ALGORITHM (SUBSTITUTION) ---
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function startHillClimb() {
    const form = document.forms["evolutionForm"];
    const message = form["message"].value;
    const rounds = parseInt(document.getElementById("roundinput").value) || 5;
    const maxTries = parseInt(document.getElementById("maxTriesInput").value) || 2000;
    const selectedNgram = parseInt(document.getElementById("ngramSelect").value) || 4;

    if (!message) return;

    document.getElementById("startEvolutionButton").disabled = true;
    document.getElementById("stopEvolutionButton").disabled = false;

    // Clear previous results
    document.getElementById("evolutionResult").innerHTML = "";

    loadNgrams(selectedNgram, () => {
        evolutionRunning = true;
        bestGlobalScore = -Infinity;
        bestGlobalKey = "";
        bestGlobalDecryption = "";

        const cleanText = getCleanText(message);
        const startTime = Date.now();
        let currentRound = 0;
        let key, bestScore, bestKey, ctr, totalIterations;

        function startRound() {
            if (!evolutionRunning || currentRound >= rounds) {
                document.getElementById("startEvolutionButton").disabled = false;
                document.getElementById("stopEvolutionButton").disabled = true;
                evolutionRunning = false;
                return;
            }

            key = shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
            bestScore = ngramScore(decodeSubstitution(cleanText, key.join("")));
            bestKey = [...key];
            ctr = 0;
            totalIterations = 0;

            requestAnimationFrame(runIterations);
        }

        function runIterations() {
            if (!evolutionRunning) return;

            let batchLimit = 500; // Process 500 iterations at a time before yielding to DOM
            while (ctr < maxTries && batchLimit > 0) {
                ctr++;
                totalIterations++;
                batchLimit--;

                let newKey = [...key];
                const a = Math.floor(Math.random() * 26);
                const b = Math.floor(Math.random() * 26);
                [newKey[a], newKey[b]] = [newKey[b], newKey[a]];

                const score = ngramScore(decodeSubstitution(cleanText, newKey.join("")));
                if (score > bestScore) {
                    bestScore = score;
                    key = [...newKey];
                    bestKey = [...newKey];
                    ctr = 0;

                    if (bestScore > bestGlobalScore) {
                        bestGlobalScore = bestScore;
                        bestGlobalKey = bestKey.join("");
                        bestGlobalDecryption = decodeSubstitution(message.toUpperCase(), bestGlobalKey);

                        const timeElapsed = Date.now() - startTime;

                        // Update UI
                        const bestKeyEl = document.getElementById("bestKey");
                        const bestKeyGenFoundEl = document.getElementById("bestKeyGenFound");
                        const bestKeyIterationFoundEl = document.getElementById("bestKeyIterationFound");
                        const bestKeyTimeFoundEl = document.getElementById("bestKeyTimeFound");
                        const bestDecryptionEl = document.getElementById("bestDecryption");

                        if(bestKeyEl) bestKeyEl.textContent = bestGlobalKey;
                        if(bestKeyGenFoundEl) bestKeyGenFoundEl.textContent = currentRound + 1;
                        if(bestKeyIterationFoundEl) bestKeyIterationFoundEl.textContent = totalIterations;
                        if(bestKeyTimeFoundEl) bestKeyTimeFoundEl.textContent = timeElapsed + "ms";
                        if(bestDecryptionEl) bestDecryptionEl.textContent = bestGlobalDecryption;

                        // Append to result list
                        const list = document.getElementById("evolutionResult");
                        const li = document.createElement("li");
                        li.style.padding = "10px";
                        li.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                        li.innerHTML = `<strong>Round ${currentRound + 1} | Iteration ${totalIterations}</strong> | Score: ${bestScore} | Time: ${timeElapsed}ms<br>
                                        <span style="color: var(--primary-color)">Key: ${bestGlobalKey}</span><br>
                                        <em>${bestGlobalDecryption.substring(0, 80)}...</em>`;
                        list.prepend(li);
                    }
                }
            }

            if (ctr < maxTries) {
                // If we hit batch limit but haven't reached max tries, yield and continue
                requestAnimationFrame(runIterations);
            } else {
                // Finished round, proceed to next round
                currentRound++;
                startRound();
            }
        }

        startRound();
    });
}

function stopHillClimb() {
    evolutionRunning = false;
    document.getElementById("startEvolutionButton").disabled = false;
    document.getElementById("stopEvolutionButton").disabled = true;
}

document.addEventListener("DOMContentLoaded", function () {
    if (typeof dataText !== 'undefined') {
        dataText = [
            ["title", "Substitution Cypher"],
            ["subtitle", "Hecking by Marswalk in Belgium :)"]
        ];
    } else {
        window.dataText = [
            ["title", "Substitution Cypher"],
            ["subtitle", "Hecking by Marswalk in Belgium :)"]
        ];
    }
    if (typeof startTextAnimation === "function") startTextAnimation(0);
    if (typeof setupExpandInfo === "function") setupExpandInfo();

    const startBtn = document.getElementById("startEvolutionButton");
    const stopBtn = document.getElementById("stopEvolutionButton");

    if (startBtn) startBtn.addEventListener("click", startHillClimb);
    if (stopBtn) stopBtn.addEventListener("click", stopHillClimb);
});
