let quadgrams = {}; // Maps 4-letter sequences to their log probability score
let quadgramsLoaded = false;
let evolutionRunning = false; // Flag to control the run state of the hill climbing loop
let bestGlobalScore = -Infinity; // Tracks the highest score found across all rounds
let bestGlobalKey = "";
let bestGlobalDecryption = "";

// Fetch the pre-computed quadgram scores from the CSV file
fetch('4gramScores.csv')
    .then(response => response.text())
    .then(text => {
        const lines = text.split('\n');
        for (let line of lines) {
            const parts = line.trim().split(' ');
            if (parts.length >= 3) {
                // Parse the 4-gram and its log probability score
                quadgrams[parts[0]] = parseInt(parts[2]);
            }
        }
        quadgramsLoaded = true;
    });

// Evaluates the fitness of a piece of text based on english quadgram frequencies
function quadgramScore(text) {
    let score = 0;
    // Iterate over every 4-letter sequence in the text
    for (let i = 0; i < text.length - 3; i++) {
        const quad = text.substring(i, i + 4);
        if (quadgrams[quad]) {
            score += quadgrams[quad];
        } else {
            // Penalize heavily for invalid or rare sequences
            score -= 3000;
        }
    }
    return score;
}

// Decodes a substitution cipher text using a provided alphabet key mapping
function decodeSubstitution(text, key) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let decoded = "";
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const idx = key.indexOf(char);
        if (idx !== -1) {
            // Map the ciphertext character to the plaintext character based on index
            decoded += alphabet[idx];
        } else {
            // Preserve non-alphabetic characters
            decoded += char;
        }
    }
    return decoded;
}

// Removes all non-alphabetic characters and uppercases the text for analysis
function getCleanText(text) {
    return text.toUpperCase().replace(/[^A-Z]/g, '');
}

// Randomizes the order of elements in an array (Fisher-Yates shuffle)
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Initiates the Hill Climbing search for the substitution cipher key
function startHillClimb() {
    if (!quadgramsLoaded) return;
    const form = document.forms["evolutionForm"];
    const message = form["message"].value;
    const rounds = parseInt(document.getElementById("roundinput").value) || 5;
    if (!message) return;

    // Toggle UI state
    document.getElementById("startEvolutionButton").disabled = true;
    document.getElementById("stopEvolutionButton").disabled = false;
    evolutionRunning = true;
    
    // Reset global tracking variables
    bestGlobalScore = -Infinity;
    bestGlobalKey = "";
    bestGlobalDecryption = "";

    const cleanText = getCleanText(message);
    const startTime = Date.now();
    let currentRound = 0;

    // Execute one round of Hill Climbing, utilizing requestAnimationFrame to avoid freezing the browser
    function runRound() {
        if (!evolutionRunning || currentRound >= rounds) {
            document.getElementById("startEvolutionButton").disabled = false;
            document.getElementById("stopEvolutionButton").disabled = true;
            evolutionRunning = false;
            return;
        }

        // Start with a completely randomized alphabet key
        let key = shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
        let bestScore = quadgramScore(decodeSubstitution(cleanText, key.join("")));
        let bestKey = [...key];
        let noImprovement = 0;

        // Perform small mutations on the key until no improvements are found after 2000 tries
        while (noImprovement < 2000) {
            noImprovement++;
            let newKey = [...key];
            
            // Mutation: swap two random letters in the key mapping
            const a = Math.floor(Math.random() * 26);
            const b = Math.floor(Math.random() * 26);
            [newKey[a], newKey[b]] = [newKey[b], newKey[a]];
            
            // Check if the mutated key decodes to a better quadgram score
            const score = quadgramScore(decodeSubstitution(cleanText, newKey.join("")));
            if (score > bestScore) {
                bestScore = score;
                key = [...newKey];
                bestKey = [...newKey];
                noImprovement = 0; // Reset counter since we found an improvement
            }
        }

        // If this round found a better absolute key, update the global UI
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
        requestAnimationFrame(runRound); // Schedule next round
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
