# *************** PYTHON FUNCTIONS *******************

# import libraries
import re
import json
from gensim.models.doc2vec import Doc2Vec, TaggedDocument

def doc2vec(search_term):

    with open('data/domain_1.json') as json_file:
        data = json.load(json_file)

    documents = [TaggedDocument(doc, [i]) for i, doc in enumerate(data)]

    model = Doc2Vec(documents, vector_size=5, window=2, min_count=1, workers=4)

    inferred_vector = model.infer_vector(search_term.split(' '))

    sims = model.docvecs.most_similar([inferred_vector], topn=len(model.docvecs))

    res = []
    for elem in sims:
        inner = {}
        inner['index'] = elem[0]
        inner['distance'] = elem[1]
        res.append(inner)

    return (res)
