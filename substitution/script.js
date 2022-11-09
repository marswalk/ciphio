let quadgrams = {};
let quadgramsLoaded = false;
let evolutionRunning = false;
let bestGlobalScore = -Infinity;
let bestGlobalKey = "";
let bestGlobalDecryption = "";

fetch('4gramScores.csv')
    .then(response => response.text())
    .then(text => {
        const lines = text.split('\n');
        for (let line of lines) {
            const parts = line.trim().split(' ');
            if (parts.length >= 3) {
                quadgrams[parts[0]] = parseInt(parts[2]);
            }
        }
        quadgramsLoaded = true;
    });

function quadgramScore(text) {
    let score = 0;
    for (let i = 0; i < text.length - 3; i++) {
        const quad = text.substring(i, i + 4);
        if (quadgrams[quad]) {
            score += quadgrams[quad];
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

function getCleanText(text) {
    return text.toUpperCase().replace(/[^A-Z]/g, '');
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

function startHillClimb() {
    if (!quadgramsLoaded) return;
    const form = document.forms["evolutionForm"];
    const message = form["message"].value;
    const rounds = parseInt(document.getElementById("roundinput").value) || 5;
    if (!message) return;

    document.getElementById("startEvolutionButton").disabled = true;
    document.getElementById("stopEvolutionButton").disabled = false;
    evolutionRunning = true;
    
    bestGlobalScore = -Infinity;
    bestGlobalKey = "";
    bestGlobalDecryption = "";

    const cleanText = getCleanText(message);
    const startTime = Date.now();
    let currentRound = 0;

    function runRound() {
        if (!evolutionRunning || currentRound >= rounds) {
            document.getElementById("startEvolutionButton").disabled = false;
            document.getElementById("stopEvolutionButton").disabled = true;
            evolutionRunning = false;
            return;
        }

        let key = shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
        let bestScore = quadgramScore(decodeSubstitution(cleanText, key.join("")));
        let bestKey = [...key];
        let noImprovement = 0;

        while (noImprovement < 2000) {
            noImprovement++;
            let newKey = [...key];
            const a = Math.floor(Math.random() * 26);
            const b = Math.floor(Math.random() * 26);
            [newKey[a], newKey[b]] = [newKey[b], newKey[a]];
            
            const score = quadgramScore(decodeSubstitution(cleanText, newKey.join("")));
            if (score > bestScore) {
                bestScore = score;
                key = [...newKey];
                bestKey = [...newKey];
                noImprovement = 0;
            }
        }

        if (bestScore > bestGlobalScore) {
            bestGlobalScore = bestScore;
            bestGlobalKey = bestKey.join("");
            bestGlobalDecryption = decodeSubstitution(message.toUpperCase(), bestGlobalKey);
            
            const bestKeyEl = document.getElementById("bestKey");
            const bestKeyGenFoundEl = document.getElementById("bestKeyGenFound");
            const bestKeyTimeFoundEl = document.getElementById("bestKeyTimeFound");
            const bestDecryptionEl = document.getElementById("bestDecryption");

            if(bestKeyEl) bestKeyEl.textContent = bestGlobalKey;
            if(bestKeyGenFoundEl) bestKeyGenFoundEl.textContent = currentRound + 1;
            if(bestKeyTimeFoundEl) bestKeyTimeFoundEl.textContent = (Date.now() - startTime) + "ms";
            if(bestDecryptionEl) bestDecryptionEl.textContent = bestGlobalDecryption;
        }

        currentRound++;
        requestAnimationFrame(runRound);
    }

    runRound();
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
