let evolutionRunning = false;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// A generic Hill Climbing algorithm to search for optimal keys
function hillClimb(message, decrypt, generateKey, permuteKey, score, keylength, maxGenerations, eachGen) {
    let currentGeneration = 0;
    
    // Start with a randomly generated key based on the specified length
    let key = generateKey(keylength);
    let bestScore = score(decrypt(message, key));
    let bestKey = key;
    let noImprovement = 0;

    // Asynchronous loop to prevent blocking the UI thread during computation
    function runRound() {
        if (!evolutionRunning || currentGeneration >= maxGenerations) {
            // End of search, send the final result
            eachGen({ done: true, value: [currentGeneration, [[bestScore, bestKey]]] });
            return;
        }

        // Apply a small mutation to the current key
        let newKey = permuteKey(key);
        let currentScore = score(decrypt(message, newKey));

        // Accept the mutation if it yields a better score
        if (currentScore > bestScore) {
            bestScore = currentScore;
            bestKey = newKey;
            key = newKey;
            noImprovement = 0; // Reset failure counter
        } else {
            noImprovement++; // Increment failure counter
        }

        // If we get stuck in a local maximum for 2000 tries, restart with a new random key
        if (noImprovement > 2000) {
            key = generateKey(keylength);
            let randomScore = score(decrypt(message, key));
            // Keep track of the absolute best key found across all restarts
            if (randomScore > bestScore) {
                bestScore = randomScore;
                bestKey = key;
            }
            noImprovement = 0;
        }

        // Send progress updates to the caller
        eachGen({ done: false, value: [currentGeneration, [[bestScore, bestKey]]] });

        currentGeneration++;
        if (evolutionRunning) {
            // Schedule the next round iteration
            requestAnimationFrame(runRound);
        }
    }

    runRound();
}

// Wrapper function to maintain compatibility with the previous genetic algorithm interface
function evolutionAlgorithm(eachGen, message, decrypt, generateKey, permuteKey, score, keylength, popSize, birthRate, randomPerGen, maxGenerations) {
    evolutionRunning = true;
    hillClimb(message, decrypt, generateKey, permuteKey, score, keylength, maxGenerations || 10000, eachGen);
}
