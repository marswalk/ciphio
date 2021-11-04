// Does typewriter text
function typeWriter(text, i, id, fnCallback) {
  if (i < (text.length)) {
    document.getElementById(id).innerHTML = text.substring(0, i) + '_';
    setTimeout(function () {
      typeWriter(text, i + 1, id, fnCallback)
    }, 60);
  }
  else if (i = text.length) {
    document.getElementById(id).innerHTML = text.substring(0, i);
    setTimeout(fnCallback, 700);
  }
}

function startTextAnimation(i) {
  // check if dataText[i] exists
  if (i < dataText.length) {
    // text exists! start typewriter animation
    typeWriter(dataText[i][1], 0, dataText[i][0], function(){
      // after callback (and whole text has been animated), start next text
      startTextAnimation(i + 1);
    });
  }
}

// Sets up the expandable info boxes
function setupExpandInfo() {
  var expandTitles = document.getElementsByClassName('expandTitle');
  var expandContents = document.getElementsByClassName('expandContent');

  for (i = 0; i < expandTitles.length; i++) {
    var t = expandTitles[i];
    var c = expandContents[i];
    t.dataset.expandId = i;
    t.addEventListener('click', function () {
      document.getElementById('ec' + String(this.getAttribute('data-expand-id'))).classList.toggle('hidden');
      this.classList.toggle('hidden');
    });
    t.classList.add("hidden")
    c.setAttribute("id", "ec" + String(i))
    c.classList.add("hidden")
  }
}

function padBefore(text, size) {
    var s = String(text);
    while (s.length < (size || 2)) {s = " " + s;}
    return s;
} // source: https://gist.github.com/endel/321925f6cafa25bbfbde

function padAfter(text, size) {
    var s = String(text);
    while (s.length < (size || 2)) {s += " ";}
    return s;
} // source: https://gist.github.com/endel/321925f6cafa25bbfbde
