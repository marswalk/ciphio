function vigenereCrypt (m, k, decrypt = true) {
  var resChar;
  var encrypted = "";
  var c;
  var i = 0;
  var l = k.length;
  var numeric = [];
  for (c of k) {
    num = alphabet.indexOf(c.toUpperCase());
    if (num > -1) {
      numeric.push(num);
    } else {
      return false;
    }
  }

  for (c of m) {
    if (alphabet.indexOf(c.toUpperCase()) > -1) {
      diff = numeric[i];
      if (decrypt) {
        diff *= -1;
      }

      resChar = alphabet.charAt( (alphabet.indexOf(c.toUpperCase()) + diff + 26) % 26 );
      if (c == c.toLowerCase()) {
        resChar = resChar.toLowerCase();
      }

      encrypted += resChar;
      i ++;
      if (i == l) {
        i = 0;
      }
    } else {
      encrypted += c
    }
  }

  return encrypted;
}