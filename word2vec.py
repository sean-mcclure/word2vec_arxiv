# *************** PYTHON FUNCTIONS *******************

# import libraries
import numpy as np
import os
from random import shuffle
import re
import urllib.request
import zipfile
import lxml.etree
from gensim.models import Word2Vec

def word2vec():
    #download the data
    '''
    urllib.request.urlretrieve("https://wit3.fbk.eu/get.php?path=XML_releases/xml/ted_en-20160408.zip&filename=ted_en-20160408.zip", filename = "ted_en-20160408.zip")
    # extract subtitle
    with zipfile.ZipFile('ted_en-20160408.zip', 'r') as z:
        doc = lxml.etree.parse(z.open('ted_en-20160408.xml', 'r'))
    input_text = '\n'.join(doc.xpath('//content/text()'))


    # remove parenthesis
    input_text_noparens = re.sub(r'\([^)]*\)', '', input_text)
     '''


    # store as list of sentences

    with open('data/all_text.txt', 'r') as content_file:
        content = content_file.read()


    sentences_strings_ted = []
    for line in content.split('\n'):
        m = re.match(r'^(?:(?P<precolon>[^:]{,20}):)?(?P<postcolon>.*)$', line)
        sentences_strings_ted.extend(sent for sent in m.groupdict()['postcolon'].split('.') if sent)
    # store as list of lists of words
    sentences_ted = []
    for sent_str in sentences_strings_ted:
        tokens = re.sub(r"[^a-z0-9]+", " ", sent_str.lower()).split()
        sentences_ted.append(tokens)

    model_ted = Word2Vec(sentences = sentences_ted, size = 100, window = 5, min_count = 5, workers = 4, sg = 0)

    output = model_ted.wv.most_similar('learning')

    res = " ".join(str(x) for x in output)

    return (res)
