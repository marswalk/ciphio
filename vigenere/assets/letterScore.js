function letterScore (text, language = "english") {
  var s, letters;
  s = frequencies[language]; // Gets the frequencies for given language
  letters = text.split("").filter(c => c in s); // Filter out letters not in language frequencies object
  return letters.reduce((t, c) => t + s[c], 0) * 1000 / letters.length; // Calculates the score
};

var frequencies = {
  "english": {
    "E": 11.2,
    "T": 9.36,
    "A": 8.50,
    "R": 7.59,
    "I": 7.55,
    "O": 7.51,
    "N": 6.75,
    "S": 6.33,
    "H": 6.09,
    "D": 4.25,
    "L": 4.03,
    "U": 2.76,
    "W": 2.56,
    "M": 2.41,
    "F": 2.23,
    "C": 2.20,
    "G": 2.02,
    "Y": 1.99,
    "P": 1.93,
    "B": 1.49,
    "K": 1.29,
    "V": 0.978,
    "J": 0.153,
    "X": 0.150,
    "Q": 0.095,
    "Z": 0.077,
  }
};
