let evolutionRunning = false;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function hillClimb(message, decrypt, generateKey, permuteKey, score, keylength, maxGenerations, eachGen) {
    let currentGeneration = 0;
    
    let key = generateKey(keylength);
    let bestScore = score(decrypt(message, key));
    let bestKey = key;
    let noImprovement = 0;

    function runRound() {
        if (!evolutionRunning || currentGeneration >= maxGenerations) {
            eachGen({ done: true, value: [currentGeneration, [[bestScore, bestKey]]] });
            return;
        }

        let newKey = permuteKey(key);
        let currentScore = score(decrypt(message, newKey));

        if (currentScore > bestScore) {
            bestScore = currentScore;
            bestKey = newKey;
            key = newKey;
            noImprovement = 0;
        } else {
            noImprovement++;
        }

        if (noImprovement > 2000) {
            key = generateKey(keylength);
            let randomScore = score(decrypt(message, key));
            if (randomScore > bestScore) {
                bestScore = randomScore;
                bestKey = key;
            }
            noImprovement = 0;
        }

        eachGen({ done: false, value: [currentGeneration, [[bestScore, bestKey]]] });

        currentGeneration++;
        if (evolutionRunning) {
            requestAnimationFrame(runRound);
        }
    }

    runRound();
}

function evolutionAlgorithm(eachGen, message, decrypt, generateKey, permuteKey, score, keylength, popSize, birthRate, randomPerGen, maxGenerations) {
    evolutionRunning = true;
    hillClimb(message, decrypt, generateKey, permuteKey, score, keylength, maxGenerations || 10000, eachGen);
}
