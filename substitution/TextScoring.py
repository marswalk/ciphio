ngrams4 = open('NGrams/4gramScores.csv', 'r')


monograms = {}
bigrams = {}
trigrams = {}
quadgrams = {}
quadgramsFrac = {}

# We use the log probabilities since they are additive
for line in ngrams4:
    L = line.split(" ")
    quadgrams[L[0]] = int(L[2])
    quadgramsFrac[L[0]] = float(L[3])


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