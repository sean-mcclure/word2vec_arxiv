import sys

from word2vec import *

function_choice = sys.argv[1]

result = eval(function_choice)

print(result)
sys.stdout.flush()
