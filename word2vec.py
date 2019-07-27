# *************** PYTHON FUNCTIONS *******************

# import libraries
import re
from gensim.models import Word2Vec
from gensim.models import FastText

def word2vec(search_term):

    with open('data/domain_1_single.txt', 'r') as content_file:
        content = content_file.read()

    sentences_strings_ted = []
    for line in content.split('\n'):
        m = re.match(r'^(?:(?P<precolon>[^:]{,20}):)?(?P<postcolon>.*)$', line)
        sentences_strings_ted.extend(sent for sent in m.groupdict()['postcolon'].split('.') if sent)

    sentences_ted = []
    for sent_str in sentences_strings_ted:
        tokens = re.sub(r"[^a-z0-9]+", " ", sent_str.lower()).split()
        sentences_ted.append(tokens)

    model_ted = FastText(sentences_ted, size=100, window=5, min_count=5, workers=4, sg=1)

    sims = model_ted.wv.most_similar(search_term)

    res = []
    for elem in sims:
        inner = {}
        inner['word'] = elem[0]
        inner['distance'] = elem[1]
        res.append(inner)

    #res = " ".join(str(x) for x in output)

    return (res)
