var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var evolutionRunning = false;

function* evolution (message, decrypt, generateKey, permuteKey, score, keylength = undefined, populationSize = 20, birthRate = 2, randomPerGeneration = 5, maxGenerations = 200) {

  // Setup
  var generation = [];
  var key;
  var nextGen;

  function birth (key) {return [score(decrypt(message, key)), key]};

  for (var i = 0; i < populationSize; i++) {
    generation.push(birth(generateKey(keylength)));
  }

  for (var n = 0; n < maxGenerations; n++) {
    yield [n, generation];

    // Adds children
    children = [];
    for (var parent of generation) {
      for (var i = 0; i < birthRate; i++) {
        children.push(birth(permuteKey(parent[1])));
      }
    }
    generation.push(...children);

    // Adds random keys
    random = [];
    for (var i = 0; i < randomPerGeneration; i++) {
      generation.push(birth(generateKey(keylength)));
    }

    // Sorts ascending and removes elements from front
    generation.sort(function(a, b) {return a[0] - b[0]});
    generation.splice(0, generation.length-populationSize);
  }

  return [n, generation];
}

// Function allowing easy use of evolution algorithm - pass it a function to run after each generation followed by the parameters for the evolution algorithm above
function evolutionAlgorithm(eachGen) {
  evolutionRunning = true;
  var result;
  var p = evolution(...Array.prototype.slice.call(arguments, 1));
  function nextGen () {
    result = p.next();
    window.requestAnimationFrame( () => {
      eachGen(result);
      if (!result['done']) {
        if (evolutionRunning) {
          nextGen();
        }
      } else {
        evolutionRunning = false;
      }
    } )
  };
  nextGen();
}
