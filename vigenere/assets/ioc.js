function ioc (text, alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", caseSensitive = false) {
	if (!caseSensitive) {
		text = text.toUpperCase();
		alphabet = alphabet.toUpperCase();
	}
	text = text.split("").filter(c => alphabet.indexOf(c) > -1).join("");
	var l = text.length;
	var ioc = 0;
	for (let i = 0; i < alphabet.length; i++) {
		a = [...text].filter(k => k === alphabet[i]).length;
		ioc += (a/l) * ((a-1)/(l-1));
	}
	return (ioc * alphabet.length);
};

var expectedIoc = {"english": 1.73};
