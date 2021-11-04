import os
import sys

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temp folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

ngrams1 = open('NGrams/1gramScores.csv', 'r')
ngrams2 = open('NGrams/2gramScores.csv', 'r')
ngrams3 = open('NGrams/3gramScores.csv', 'r')
ngrams4 = open('NGrams/4gramScores.csv', 'r')


monograms = {}
bigrams = {}
trigrams = {}
quadgrams = {}
quadgramsFrac = {}

# We use the log probabilities since they are additive
for line in ngrams1:
    L = line.split(" ")
    monograms[L[0]] = int(L[2])

for line in ngrams2:
    L = line.split(" ")
    bigrams[L[0]] = int(L[2])

for line in ngrams3:
    L = line.split(" ")
    trigrams[L[0]] = int(L[2])
    
for line in ngrams4:
    L = line.split(" ")
    quadgrams[L[0]] = int(L[2])
    quadgramsFrac[L[0]] = float(L[3])


def monogramScore(text):
    score = 0
    for i in range(len(text)-1):
        score += monograms[text[i]]
    return score

def bigramScore(text):
    score = 0
    for i in range(len(text)-1):
        score += bigrams[text[i:i+2]]
    return score

def trigramScore(text):
    score = 0
    for i in range(len(text)-1):
        if text[i:i+3] not in trigrams.keys():
            score -= 3000
        else:
            score += trigrams[text[i:i+3]]
    return score


def quadgramScore(text):
    score = 0
    for i in range(len(text)-1):
        if text[i:i+4] not in quadgrams.keys():
            score -= 3000
        else:
            score += quadgrams[text[i:i+4]]
    return score

def quadgramScoreFrac(text):
    score = 0
    for i in range(len(text)-1):
        if text[i:i+4] not in quadgrams.keys():
            score -= 25
        else:
            score += quadgramsFrac[text[i:i+4]]
    return score