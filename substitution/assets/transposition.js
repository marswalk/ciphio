function transpositionCrypt (m, k, decrypt = true, pad = "X") {
  var keylength = k.length;
  while (m.length % keylength) {
    m += pad;
  }

  /*
  // Converts key to numbers
  if (decrypt) {
    var sorted = k;
    k = k.split("").sort();
  } else {
    var sorted = k.split("").sort();
  }
  var numeric = [];
  for (var c of sorted) {
      numeric.push(k.indexOf(c));
  }

  // Checks no repeated letters in key
  if (keylength != new Set(numeric).size) {
    return false;
  }
  */

  var result = "";
  for (var row = 0; row < m.length / keylength; row++) {
    for (col of k) {
      result += m[row*keylength + col];
    }
  }

  return result;
}
