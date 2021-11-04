from TextScoring import quadgramScore
from browser import document, alert
import time
import random


def time_convert(sec):
    mins = sec // 60
    sec = sec % 60
    hours = mins // 60
    mins = mins % 60
    return "{0:0>2}:{1:0>2}:{2:0>2}".format(int(hours), int(mins), int(sec))


def saveFormat(S, alphabet=""):
    if alphabet == "":
        alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

    final, case = [], []

    pos, char = [], []
    for ps, ch in enumerate(S):
        if ch not in alphabet:
            char.append(ch)
            pos.append(ps)
        else:
            final.append(ch.upper())
            case.append(ch.isupper())
    return "".join(final), pos, char, case


def restoreFormat(S, pos, char, case):
    T = [i for i in S]
    for ps, ca in enumerate(case):
        if T[ps].isupper() != ca:
            if ca:
                T[ps] = T[ps].upper()
            else:
                T[ps] = T[ps].lower()

    S = "".join(T)

    for ps, ch in zip(pos, char):
        S = S[:ps] + ch + S[ps:]
    return S


def substitution(text, key, decode=False, alphabet=""):
    if alphabet == "":
        alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    # Include every unique letter of the key in the order it appears
    k = ""
    for letter in key:
        if letter not in alphabet:
            raise Exception('{} is not in the alphabet'.format(letter))
        if letter not in k:
            k += letter
    # Put in every unused letter of the alphabet into the key
    for letter in alphabet:
        if letter not in k:
            k += letter

    KEY = k

    out = []

    if decode == False:
        for i in text:
            out.append(KEY[alphabet.index(i)])
    if decode == True:
        for i in text:
            out.append(alphabet[KEY.index(i)])

    return "".join(out)


def hillClib(ctext, rounds=10):
    finalScore = quadgramScore(ctext)
    iterations = 0
    # There will be one thousand rounds of attempts to break the cipher
    # The reason we have multiple rounds is because we might get stuck in a 
    # local minima while mutating the results.
    # Occasionally resetting gives coverage of more of the possible search
    # space.
    for x in range(rounds):
        # To start the round we randomize the alphabet to start with
        key = [i for i in "ABCDEFGHIJKLMNOPQRSTUVWXYZ"]
        random.shuffle(key)

        # Our starting score is whatever we got from this
        out = substitution(ctext, "".join(key), decode=True)
        bestscore = quadgramScore(out)
        bestkey = "".join(key)

        # Within each round we keep mutating the key until we go a few thousand
        # mutations without improvement.
        ctr = 0
        while ctr < 2000:
            # Count how many mutations since the last improvement
            ctr += 1

            # A copy of the key list that we can mutate
            newKey = key[:]

            # The mutation is swapping two letters
            A = random.randint(0, 25)
            B = random.randint(0, 25)
            newKey[A], newKey[B] = newKey[B], newKey[A]

            # Try it and see what score we get
            out = substitution(ctext, "".join(newKey), decode=True)
            print(out)
            score = quadgramScore(out)
            iterations += 1

            # If that score is better than before write it down and reset the
            # counter.
            if score > bestscore:
                ctr = 0
                key = newKey
                bestkey = newKey
                bestscore = score

        # At the end of each round check if it produced a better score than
        # any previous round. If it did then write it down and print some
        # information.
        if bestscore > finalScore:
            finalOut = substitution(ctext, "".join(bestkey), decode=True)
            finalScore = bestscore
            print(finalOut, finalScore)


        else:
            pass

    return finalOut


def start(ev):
    ATTEMPTS = int(document['roundinput'].value)
    print(ATTEMPTS)

    TEXT = document['evolutionMessage'].value

    TEXT, pos, char, case = saveFormat(TEXT)

    startime = time.time()
    tx = hillClib(TEXT, ATTEMPTS)

    alert('FINAL RESTORED TEXT IN ALL ITS GLORY (IM SO PROUD OF THE FORMATTING RESTORE FUNCTION OMG:'+
          restoreFormat(tx, pos, char, case))
    alert('TOTAL TIME LAPSED (hh/mm/ss):'+ time_convert(time.time() - startime))

def stop(ev):
    InfoDialog("Hello", f"Hello,")

document["startEvolutionButton"].bind("click", start)
document["stopEvolutionButton"].bind("click", stop)