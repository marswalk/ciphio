let ngrams = {};
let currentNgramSize = 4;
let ngramsLoaded = false;
let evolutionRunning = false;

// English letter frequencies for Chi-Square Caesar solving
const englishFreqs = [0.08167, 0.01492, 0.02782, 0.04253, 0.12702, 0.02228, 0.02015, 0.06094, 0.06966, 0.00153, 0.00772, 0.04025, 0.02406, 0.06749, 0.07507, 0.01929, 0.00095, 0.05987, 0.06327, 0.09056, 0.02758, 0.00978, 0.02360, 0.00150, 0.01974, 0.00074];

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

// --- CORE ALGORITHM (VIGENERE) ---
function decodeVigenere(text, key) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let decoded = "";
    let j = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const idx = alphabet.indexOf(char.toUpperCase());
        if (idx !== -1) {
            const shift = alphabet.indexOf(key[j % key.length]);
            const newIdx = (idx - shift + 26) % 26;

            // Preserve original case
            if (char === char.toLowerCase()) {
                decoded += alphabet[newIdx].toLowerCase();
            } else {
                decoded += alphabet[newIdx];
            }
            j++;
        } else {
            decoded += char;
        }
    }
    return decoded;
}

// --- KASISKI EXAMINATION ---
function getKasiskiKeyLengths(text) {
    let repeated = {};
    for (let j = 4; j <= 5; j++) {
        for (let i = 0; i < text.length - j; i++) {
            let sub = text.substring(i, i + j);
            if (!repeated[sub]) repeated[sub] = [];
            repeated[sub].push(i);
        }
    }

    let differences = [];
    for (let sub in repeated) {
        let occ = repeated[sub];
        if (occ.length > 1) {
            for (let i = 0; i < occ.length - 1; i++) {
                differences.push(occ[i+1] - occ[i]);
            }
        }
    }

    let factorsCount = {};
    for (let diff of differences) {
        for (let m = 2; m <= 30; m++) { // Max likely key length 30
            if (diff % m === 0) {
                factorsCount[m] = (factorsCount[m] || 0) + 1;
            }
        }
    }

    let sortedFactors = Object.keys(factorsCount).map(k => parseInt(k)).sort((a, b) => factorsCount[b] - factorsCount[a]);
    if (sortedFactors.length === 0) {
        return [2,3,4,5,6,7,8,9,10,11,12,13,14,15]; // Fallback
    }
    return sortedFactors.slice(0, 20); // Top 20 likely lengths
}

// Solve Caesar slice using robust Chi-Square
function solveCaesarSlice(sliceChars) {
    let bestShift = 0;
    let bestChiSq = Infinity;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let shift = 0; shift < 26; shift++) {
        let counts = new Array(26).fill(0);
        for (let ch of sliceChars) {
            let newIdx = (alphabet.indexOf(ch) - shift + 26) % 26;
            counts[newIdx]++;
        }

        let chiSq = 0;
        let total = sliceChars.length;
        for (let i = 0; i < 26; i++) {
            let expected = total * englishFreqs[i];
            let actual = counts[i];
            if (expected > 0) {
                chiSq += Math.pow(actual - expected, 2) / expected;
            }
        }

        if (chiSq < bestChiSq) {
            bestChiSq = chiSq;
            bestShift = shift;
        }
    }
    return alphabet[bestShift];
}

function startVigenereCrack() {
    const form = document.forms["evolutionForm"];
    const message = form["message"].value;
    const isKnownLength = document.getElementById("checker").checked;
    const knownLength = parseInt(document.getElementById("keylengthbox").value) || 10;
    const selectedNgram = parseInt(document.getElementById("ngramSelect").value) || 2;

    if (!message) return;

    document.getElementById("startEvolutionButton").disabled = true;
    document.getElementById("stopEvolutionButton").disabled = false;
    document.getElementById("evolutionResult").innerHTML = "";

    loadNgrams(selectedNgram, () => {
        evolutionRunning = true;
        const cleanText = getCleanText(message);
        const startTime = Date.now();

        let keyLengthsToTest = [];
        if (isKnownLength) {
            keyLengthsToTest.push(knownLength);
        } else {
            keyLengthsToTest = getKasiskiKeyLengths(cleanText);
        }

        let bestGlobalScore = -Infinity;
        let bestGlobalKey = "";
        let bestGlobalDecryption = "";
        let currentIndex = 0;

        function checkNextKeyLength() {
            if (!evolutionRunning || currentIndex >= keyLengthsToTest.length) {
                document.getElementById("startEvolutionButton").disabled = false;
                document.getElementById("stopEvolutionButton").disabled = true;
                evolutionRunning = false;
                return;
            }

            let klen = keyLengthsToTest[currentIndex];

            // Slice the text
            let slices = Array.from({length: klen}, () => []);
            for (let i = 0; i < cleanText.length; i++) {
                slices[i % klen].push(cleanText[i]);
            }

            // Solve each slice robustly using Chi-Square
            let keyArray = [];
            for (let i = 0; i < klen; i++) {
                keyArray.push(solveCaesarSlice(slices[i]));
            }
            let key = keyArray.join("");

            // Decrypt and score
            let decodedCleanText = decodeVigenere(cleanText, key);
            let score = ngramScore(decodedCleanText);

            if (score > bestGlobalScore) {
                bestGlobalScore = score;
                bestGlobalKey = key;
                bestGlobalDecryption = decodeVigenere(message, key); // Decrypt original message with case/punctuation

                const timeElapsed = Date.now() - startTime;

                const bestKeyEl = document.getElementById("bestKey");
                const bestKeyLengthFoundEl = document.getElementById("bestKeyLengthFound");
                const bestKeyTimeFoundEl = document.getElementById("bestKeyTimeFound");
                const bestDecryptionEl = document.getElementById("bestDecryption");

                if(bestKeyEl) bestKeyEl.textContent = bestGlobalKey;
                if(bestKeyLengthFoundEl) bestKeyLengthFoundEl.textContent = bestGlobalKey.length;
                if(bestKeyTimeFoundEl) bestKeyTimeFoundEl.textContent = timeElapsed + "ms";
                if(bestDecryptionEl) bestDecryptionEl.textContent = bestGlobalDecryption;

                const list = document.getElementById("evolutionResult");
                const li = document.createElement("li");
                li.style.padding = "10px";
                li.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
                li.innerHTML = `<strong>Key Length: ${bestGlobalKey.length}</strong> | Score: ${bestGlobalScore} | Time: ${timeElapsed}ms<br>
                                <span style="color: var(--primary-color)">Key: ${bestGlobalKey}</span><br>
                                <em>${bestGlobalDecryption.substring(0, 80)}...</em>`;
                list.prepend(li);
            }

            currentIndex++;
            // Yield for 5ms to slow down slightly for the live visual feed
            setTimeout(() => requestAnimationFrame(checkNextKeyLength), 50);
        }

        checkNextKeyLength();
    });
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

    if (startBtn) startBtn.addEventListener("click", startVigenereCrack);
    if (stopBtn) stopBtn.addEventListener("click", stopEvolution);
    if (testBtn) testBtn.addEventListener("click", () => {
        document.getElementById("evolutionMessage").value = "SIXYRPOGTSCMJHGKWUEVPIRSRUCNKYCMCORPVUNIMMKUXEWFWHEWZOXHFWZEPWRVZPGNKHTLOKHZCGWXSQTNMVIJKIEAUTXVBYAEXZKHESMLWEWTEOHWWHYXSIZVNYCPWVWWXKLDWFDJTVJZHTSNZMYOGIBAAIJICMRLOHBNXSCUKAHAOWCPPAUVGAVYYVZCVOXYSCKKCMGAUBHCLJPMRZEPYYLLPZKPLHRCEMYQYOBUULWXFZTVGIFYSOTVMDPPWWATSMXZLLJYFXJAOERLOLKSYITKXCSHLLPKUSWDOLXMLTQHBUHYJGPXZWBSSXGIDVZZXLANGFPOOCBUUGMGSJGJDPTSGYOWTAAHJYSRJBNPGNTIJQPBUDHYYIFXSMTTTFPYQSFKUBEKGYFHZDKYLVAYFIHJOLLMCLEIEWZYTPBOHAPZKJXPJYVEDBGJDVTGSXPZOHEMFIEPZVJVGHQIMTWMUMPLSEKERWZOTAACYLEUGRXHUIGHPFKYVPGYXSCBNLFHBXOLTTKAALTCJWENKDMLLNKECMXLEHHCNIWGYPFWZYAXHWASWISUYSZLKEXYQCKIQWXFHBBASRLTEZMZHILVJBUDHYYIMXHPGAMOSSSVPBKSEPBAMWTPGCXHHNSGSMJAALTCJWEQZLFMFIEXSMHHMJVMGCZCIHGZSYOLLBOTXHBCOSFTJCXYMXWECTESBRSNGOYWCDAHHNZIRZKHMTONLICZKMXYGNGEYLOZNZDYUXJWADBSZQSREBURGVKNGSEPKYXJFOAXDLUUMUSYVXZSTVPTIWZXZJXLTRHBAWZVKPYAVYQLLDKKHUSIMVTVJBVAWIFXCIOUBUUIFFLAOJVPDBWVDBNLRZVIMPOJKMBUSGQGZTRLTNIYKLPZKOTCSHAGVVGTXKHBAWQQRLMOSFAKSBNVNZSWGRDXOYTJMVWGLCYLHMKBWVPBNLIHDYJWHMXLYVIHVXSIZTTRSMAXDWAUWHZILQZZKPFWFYKWTDKAAHBCLJTZYAEVCEKFFBEVNUSPWVVVUDPOSLWWZUKAAPBADMVMZOBZACYLETKHWPVUNIDMZBIHGYUYCMUUEPBYKCDBKTLVHBWXCIOUXLGWSRRMZHVJSMKXZKGZXMWFWWLVJZXURGWXSMOYTAHYETEAGAWLQCHLPZOUZPTSGYAWOUMAVYEXSMXLMOSHAATTRJALQEZSHBNLRHFYYIEBOUZVBGSCMMZOXFQIMPOTUVDHHNZIMWYZVVRYTVPIQPGNUOAHPIYDXSZCXXSMEUXLRNGFCCYONWHBWMCAQPESGUDPEPKIXZHDGHTM";
    });
});
