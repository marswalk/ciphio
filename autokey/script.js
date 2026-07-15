let ngrams = {};
let dictionary = [];
let currentNgramSize = 4;
let ngramsLoaded = false;
let dictLoaded = false;
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

function loadDictionary(callback) {
    dictLoaded = false;
    dictionary = [];
    fetch(`../assets/dictionary.txt`)
        .then(response => response.text())
        .then(text => {
            const lines = text.split('\n');
            for (let line of lines) {
                let word = line.trim().toUpperCase().replace(/[^A-Z]/g, '');
                if (word !== "") dictionary.push(word);
            }
            dictLoaded = true;
            if (callback) callback();
        })
        .catch(error => {
            console.error("Error loading dictionary:", error);
            alert("Failed to load Dictionary.");
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

// --- CORE ALGORITHM (AUTOKEY) ---
function decodeAutokey(text, keyword) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let decoded = "";
    
    for (let i = 0; i < text.length; i++) {
        let textChar = text[i];
        let keyChar = i < keyword.length ? keyword[i] : decoded[i - keyword.length];
        
        let shift = alphabet.indexOf(keyChar);
        let textIdx = alphabet.indexOf(textChar);
        
        let decodedIdx = (textIdx - shift + 26) % 26;
        decoded += alphabet[decodedIdx];
    }
    return decoded;
}

// --- UI HANDLERS & BRUTE FORCE ---
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

async function startAutokeyCrack() {
    const form = document.forms["evolutionForm"];
    const message = getCleanText(form["message"].value);
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
    if (!dictLoaded) {
        await new Promise(resolve => loadDictionary(resolve));
    }
    
    if (document.getElementById("totalWords")) document.getElementById("totalWords").innerText = dictionary.length;
    
    let wordIndex = 0;
    
    function step() {
        let iterations = 0;
        // Process up to 5000 words per frame to keep UI perfectly responsive
        while (iterations < 5000 && wordIndex < dictionary.length) {
            if (!evolutionRunning) return;
            
            let keyword = dictionary[wordIndex];
            let currentDecryption = decodeAutokey(message, keyword);
            let currentScore = ngramScore(currentDecryption);
            
            if (currentScore > bestGlobalScore) {
                bestGlobalScore = currentScore;
                bestGlobalKey = keyword;
                bestGlobalDecryption = currentDecryption;
                updateBestUI();
            }
            
            wordIndex++;
            iterations++;
        }
        
        if (document.getElementById("currentIteration")) document.getElementById("currentIteration").innerText = wordIndex;
        
        if (wordIndex < dictionary.length && evolutionRunning) {
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
    
    if (startBtn) startBtn.addEventListener("click", startAutokeyCrack);
    if (stopBtn) stopBtn.addEventListener("click", stopEvolution);
    if (testBtn) testBtn.addEventListener("click", () => {
        document.getElementById("evolutionMessage").value = "JIGYCZHMSFPMDMORZEPRRDTLKESTDFPRKAQCYERLZMLNZBJPIQXLBSIDKQAHIOCQNIWHDROLAWGVWPMWVABSXHBXFKMGIBWSGWWMQFRETLKIIAWWWYSPTYEAVPBBAKVVXFFFFYWNTZCIAJLDZRMGKABSEUPBZURFZXXSMEEXQSMMRMTHROOESLOQXELWUFBNWLKISCHNVVEBTAKMTYFYEAENOIEZPZOMLHHZQQFIVPUVTZWACETFRULVNYVOXAWSQPOLDMZUATCIELQWDBLXYJALLENUWJRNGKIXSYWDETTTDHKRNVTPBCMCMTZNISHTAYXVSIEGHTIKUOWOKSCXPOGOEKMZOWNWSRVUYSNGFTCMNTDHYURZTKFDOHBPVVXANRIILAUAPYJRMGBXZYWVFRAZRVOPUIFJKSUILTHIMMGIINEZRWTEZVHCWBVGNOXFAVOFNMLYVFULZSUCZLQBXDYEQTQTPOGFCSXRSTSWZOTFMSKHZAONIXKFQLWBJFTBZIROEWDLULRWDLNTVLAJJEKWQYWWKIOXDAKMMIWYLQHTWCABIDFPLUAOAZREIXKFQLWBJFTGGYSURLOFLYTFTZRJRLHKHIIHIPKYKHNAAFAKXAIJLZRZYDTPNBYSBAAXLEWMHGMMULAMYMDXKWFXTJSOFVOWPYHWJSBQSYYHNLMQAHNBEAYLQDAFSOHVVCWOMKVEMVVYAPVKGHDANRXTAQGKXEKDEYXVJKSFRUALISCHKLSGJAKEJKUJBEZGNBPMCYGVAKSQKBMKWFFHBGWHRGHXRSZFIMUHKNLGHDHIZWOXXPNLVRCPFOLHMUEJYUWAHIWKQBQNTTQBVGXOVOIFOQPJPZMTUBWLCJZHBPBTLTCYHNCHWYPQYIIPDLEXYLSCIEMJKIEZMFDUIEJLELBZJTTKAALZCYLVVBMHMTOPQQMTAWQFSHWBWVSYDLTRTXYWLEGIWGQRUXMONZDDLSBFSYYFLTDCNZRRPWFBFVWAUKVXZSVDXYPRFBETWBKUFHMYMOYOCFEASRAYOESOKTIKLABSPBRMGNTAWMZOBDQIJPALZEVMAUKEKIVOGEGRNCEIGLDBRQKMLAIFJOBUIXJCIAKILCCPKWLTQEEKWYWNEKESLDIFDZHLLRLDEMAIUGTLTXPTVAPAHVKVVPJPWHVWNLHNWSUGAXYIFALRZABSPPPAKVSQDXJOFONXNIRTZRMSGFILHSGTEWDSNSHJQCELWEVSLOLLJSESTJGONMOXKUSLRGYQMOPIXPLPJVJXKXMOVYVAIQKBWPLHDPPTJSVTESWBPDMQSEMW";
    });
});
